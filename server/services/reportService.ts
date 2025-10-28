import R from 'ramda'
import { IncidentClient } from '../data'
import logger from '../../log'
import { PageResponse } from '../utils/page'
import OffenderService from './offenderService'
import LocationService from './locationService'
import ReportLogClient from '../data/reportLogClient'
import { InTransaction } from '../data/dataAccess/db'
import type {
  ReportSummary,
  IncompleteReportSummary,
  Report,
  ReportEdit,
  AnonReportSummary,
} from '../data/incidentClientTypes'

import type { LoggedInUser } from '../types/uof'
import AuthService from './authService'
import { Change } from './editReports/types/reportEditServiceTypes'

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

export type AnonReportSummaryWithPrison = AnonReportSummary & { prisonName: string }

const toReport =
  (namesByOffenderNumber: NamesByOffenderNumber) =>
  (reportSummary: ReportSummary | IncompleteReportSummary): IncidentSummary => ({
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
    private readonly offenderService: OffenderService,
    private readonly locationService: LocationService,
    private readonly reportLogClient: ReportLogClient,
    private readonly inTransaction: InTransaction,
    private readonly authService: AuthService
  ) {}

  private async getOffenderNames(username, incidents: ReportSummary[]): Promise<NamesByOffenderNumber> {
    const token = await this.authService.getSystemClientToken(username)
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return this.offenderService.getOffenderNames(token, offenderNos)
  }

  async getReport(userId: string, reportId: number): Promise<Report> {
    const report = await this.incidentClient.getReport(userId, reportId)

    if (!report) {
      throw new Error(`Report does not exist: ${reportId}`)
    }
    return report
  }

  async getReportEdits(reportId: number): Promise<ReportEdit[]> {
    const edits = await this.incidentClient.getReportEdits(reportId)
    return edits
  }

  async getAnonReportSummary(token: string, statementId: number): Promise<AnonReportSummaryWithPrison | undefined> {
    const report = await this.incidentClient.getAnonReportSummary(statementId)
    if (!report) {
      return undefined
    }
    const prison = await this.locationService.getPrisonById(token, report.agencyId)
    return { ...report, prisonName: prison.description }
  }

  async getReports(userId: string, page: number): Promise<PageResponse<IncidentSummary>> {
    const reports = await this.incidentClient.getReports(userId, page)
    const offenderNosToNames = await this.getOffenderNames(userId, reports.items)
    return reports.map(toReport(offenderNosToNames))
  }

  async deleteReport(username: string, reportId: number): Promise<void> {
    logger.info(`User: ${username} is deleting report: '${reportId}'`)

    const report = await this.incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }

    await this.incidentClient.deleteReport(username, reportId)
  }

  private getUpdatedReport(
    existingReport: Record<string, unknown>,
    formName: string,
    updatedSection
  ): Record<string, unknown> | false {
    const updatedFormObject = {
      ...existingReport,
      [formName]: updatedSection,
    }

    const payloadChanged = !R.equals(existingReport, updatedFormObject)
    return payloadChanged ? updatedFormObject : false
  }

  public async update(
    currentUser: LoggedInUser,
    reportId: number,
    formName: string,
    updatedSection: unknown,
    incidentDate?: Date | null
  ): Promise<void> {
    const { id, form } = await this.incidentClient.getReportForReviewer(reportId)

    const updatedPayload = this.getUpdatedReport(form, formName, updatedSection)

    if (updatedPayload || incidentDate) {
      const { username } = currentUser
      logger.info(`Updated report with id: ${id} for user: ${username}`)

      this.inTransaction(async query => {
        await this.incidentClient.update(id, incidentDate, updatedPayload, query)
        await this.reportLogClient.insert(query, username, reportId, 'REPORT_MODIFIED', {
          formName,
          originalSection: form[formName],
          updatedSection,
        })
      })
    }
  }

  private getUpdatedReportWithEdits(
    existingReport: Record<string, unknown>,
    formName: string,
    updatedSection
  ): Record<string, unknown> {
    return {
      ...existingReport,
      [formName]: updatedSection,
    }
  }

  public async updateTwoReportSections(user, data) {
    const { username, displayName } = user
    const { id, form } = await this.incidentClient.getReportForReviewer(data.reportId)
    const [key1, key2] = data.keys

    const updatedFormPayload = {
      ...form,
      ...{ [key1]: data.formSections[key1].payload },
      ...{ [key2]: data.formSections[key2].payload },
    }

    const changesToPersistInReportEdit = { ...data.formSections[key1].changes, ...data.formSections[key2].changes }

    const dataForEditTable = {
      username,
      displayName,
      reportId: data.reportId,
      changes: changesToPersistInReportEdit,
      reason: data.reason,
      reasonText: data.reasonText,
      reasonAdditionalInfo: data.reasonAdditionalInfo,
      reportOwnerChanged: false,
    }

    this.inTransaction(async query => {
      // update original report
      await this.incidentClient.updateWithEdits(id, null, null, updatedFormPayload, query)

      //  add new record into report_edit
      await this.incidentClient.insertReportEdit(dataForEditTable, query)

      // audit logs
      await this.reportLogClient.insert(query, username, data.reportId, 'REPORT_MODIFIED', {
        formName: key1,
        originalSection: form[key1],
        updatedSection: data.formSections[key1].payload,
      })

      await this.reportLogClient.insert(query, username, data.reportId, 'REPORT_MODIFIED', {
        formName: key2,
        originalSection: form[key2],
        updatedSection: data.formSections[key2].payload,
      })

      logger.info(`Updated report with id: ${id} for user: ${username}`)
    })
  }

  public async updateWithEdits(
    currentUser: LoggedInUser,
    reportId: number,
    formName: string,
    updatedSection: unknown,
    changes: unknown,
    reason: string,
    reasonText: string,
    reasonAdditionalInfo: string,
    reportOwnerChanged = false,
    incidentDate?: Date | null
  ): Promise<void> {
    const { id, form } = await this.incidentClient.getReportForReviewer(reportId)

    const updatedPayload = this.getUpdatedReportWithEdits(form, formName, updatedSection)

    if (updatedPayload || incidentDate) {
      const { username, displayName } = currentUser
      logger.info(`Updated report with id: ${id} for user: ${username}`)

      const dataForEditTable = {
        username,
        displayName,
        reportId,
        changes,
        reason,
        reasonText,
        reasonAdditionalInfo,
        reportOwnerChanged,
      }

      this.inTransaction(async query => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const agencyId = changes.agencyId?.newValue || null // if agencyId is null, the DB query will ensure the current value is retained

        // update original report
        await this.incidentClient.updateWithEdits(id, incidentDate, agencyId, updatedPayload, query)

        //  add new record into report_edit
        await this.incidentClient.insertReportEdit(dataForEditTable, query)

        await this.reportLogClient.insert(query, username, reportId, 'REPORT_MODIFIED', {
          formName,
          originalSection: form[formName],
          updatedSection,
        })
      })
    }
  }

  public async deleteIncidentAndUpdateReportEdit(
    user: LoggedInUser,
    data: { reportId: number; reasonForDelete: string; reasonForDeleteText: string; changes: Change }
  ): Promise<void> {
    const { reportId, reasonForDelete, reasonForDeleteText, changes } = data
    logger.info(`User: ${user.username} is deleting report: '${data.reportId}'`)

    const report = await this.incidentClient.getReportForReviewer(data.reportId)
    if (!report) {
      throw new Error(`Report: '${data.reportId}' does not exist`)
    }

    const dataForEditTable = {
      username: user.username,
      displayName: user.displayName,
      reportId: data.reportId,
      changes,
      reason: reasonForDelete,
      reasonText: reasonForDeleteText,
      reasonAdditionalInfo: '',
      reportOwnerChanged: false,
    }

    this.inTransaction(async query => {
      // update original report with deleted date
      await this.incidentClient.deleteReport(user.username, reportId)

      //  add new record into report_edit
      await this.incidentClient.insertReportEdit(dataForEditTable, query)
    })
  }
}
