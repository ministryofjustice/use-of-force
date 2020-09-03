import moment from 'moment'

import type IncidentClient from '../data/incidentClient'
import type { ReportSummary, IncompleteReportSummary } from '../data/incidentClientTypes'
import type { SystemToken } from '../types/uof'

import logger from '../../log'
import { isNilOrEmpty } from '../utils/utils'
import { check as getReportStatus } from './reportStatusChecker'
import { InTransaction } from '../data/dataAccess/db'
import { PageResponse } from '../utils/page'
import OffenderService from './offenderService'

interface NamesByOffenderNumber {
  [offenderNo: string]: string
}

export interface IncidentSummary {
  id: number
  bookingId: number
  incidentdate: Date
  staffMemberName: string
  offenderName: string
  offenderNo: string
  status: string
}

const toReport = (namesByOffenderNumber: NamesByOffenderNumber) => (
  reportSummary: ReportSummary | IncompleteReportSummary
): IncidentSummary => ({
  id: reportSummary.id,
  bookingId: reportSummary.bookingId,
  incidentdate: reportSummary.incidentDate,
  staffMemberName: reportSummary.reporterName,
  offenderName: namesByOffenderNumber[reportSummary.offenderNo],
  offenderNo: reportSummary.offenderNo,
  status: reportSummary.status,
})

export default class ReportService {
  constructor(
    private readonly incidentClient: IncidentClient,
    private readonly elite2ClientBuilder,
    private readonly involvedStaffService,
    private readonly notificationService,
    private readonly offenderService: OffenderService,
    private readonly inTransaction: InTransaction,
    private readonly systemToken: SystemToken
  ) {}

  private async getOffenderNames(username, incidents: ReportSummary[]): Promise<NamesByOffenderNumber> {
    const token = await this.systemToken(username)
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return this.offenderService.getOffenderNames(token, offenderNos)
  }

  getCurrentDraft(userId, bookingId) {
    return this.incidentClient.getCurrentDraftReport(userId, bookingId)
  }

  getReportStatus(report) {
    return getReportStatus(report)
  }

  async getReport(userId, reportId) {
    const report = this.incidentClient.getReport(userId, reportId)

    if (!report) {
      throw new Error(`Report does not exist: ${reportId}`)
    }
    return report
  }

  async getReports(userId: string, page: number): Promise<PageResponse<IncidentSummary>> {
    const reports = await this.incidentClient.getReports(userId, page)
    const offenderNosToNames = await this.getOffenderNames(userId, reports.items)
    return reports.map(toReport(offenderNosToNames))
  }

  async isDraftComplete(username: string, bookingId: number) {
    const { form = {} } = await this.getCurrentDraft(username, bookingId)
    const { complete } = getReportStatus(form)
    return complete
  }

  async update({ currentUser, formId, bookingId, formObject, incidentDate }) {
    const incidentDateValue = incidentDate ? incidentDate.value : null
    const formValue = !isNilOrEmpty(formObject) ? formObject : null

    return formId
      ? this.updateReport(formId, bookingId, currentUser, incidentDateValue, formValue)
      : this.startNewReport(bookingId, currentUser, incidentDateValue, formObject)
  }

  async updateAgencyId(agencyId, username, bookingId) {
    logger.info('updating agencyId')
    await this.incidentClient.updateAgencyId(agencyId, username, bookingId)
  }

  private async updateReport(formId, bookingId, currentUser, incidentDateValue, formValue) {
    const { username: userId } = currentUser
    if (incidentDateValue || formValue) {
      logger.info(`Updated report with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
      await this.incidentClient.updateDraftReport(formId, incidentDateValue, formValue)
    }
    return formId
  }

  private async startNewReport(bookingId, currentUser, incidentDateValue, formObject) {
    const { username: userId, displayName: reporterName } = currentUser

    const token = await this.systemToken(userId)
    const elite2Client = this.elite2ClientBuilder(token)
    const { offenderNo, agencyId } = await elite2Client.getOffenderDetails(bookingId)
    const id = await this.incidentClient.createDraftReport({
      userId,
      reporterName,
      bookingId,
      agencyId,
      offenderNo,
      incidentDate: incidentDateValue,
      formResponse: formObject,
    })
    logger.info(`Created new report with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    return id
  }

  async requestStatements({ reportId, currentUser, incidentDate, overdueDate, submittedDate, staffMembers }) {
    const staffExcludingReporter = staffMembers.filter(staff => staff.userId !== currentUser.username)
    const staffExcludingUnverified = staffExcludingReporter.filter(staff => staff.email)
    const notifications = staffExcludingUnverified.map(staff =>
      this.notificationService.sendStatementRequest(
        staff.email,
        {
          involvedName: staff.name,
          reporterName: currentUser.displayName,
          incidentDate,
          overdueDate,
          submittedDate,
        },
        { reportId, statementId: staff.statementId }
      )
    )
    return Promise.all(notifications)
  }

  async submit(currentUser, bookingId, now = () => moment()) {
    const { id, incidentDate } = await this.getCurrentDraft(currentUser.username, bookingId)
    if (id) {
      const reportSubmittedDate = now()
      const overdueDate = moment(reportSubmittedDate).add(3, 'days')

      const staff = await this.inTransaction(async client => {
        const savedStaff = await this.involvedStaffService.save(
          id,
          reportSubmittedDate,
          overdueDate,
          currentUser,
          client
        )
        logger.info(`Submitting report for user: ${currentUser.username} and booking: ${bookingId}`)
        await this.incidentClient.submitReport(currentUser.username, bookingId, reportSubmittedDate.toDate(), client)
        return savedStaff
      })

      await this.requestStatements({
        reportId: id,
        currentUser,
        incidentDate,
        overdueDate,
        submittedDate: reportSubmittedDate,
        staffMembers: staff,
      })

      return id
    }
    return false
  }

  async deleteReport(username, reportId) {
    logger.info(`User: ${username} is deleting report: '${reportId}'`)

    const report = await this.incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }

    await this.incidentClient.deleteReport(reportId)
  }
}
