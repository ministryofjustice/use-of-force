import R from 'ramda'
import { IncidentClient } from '../data'

import logger from '../../log'
import { PageResponse } from '../utils/page'
import OffenderService from './offenderService'
import LocationService from './locationService'
import ReportLogClient from '../data/reportLogClient'
import { InTransaction } from '../data/dataAccess/db'
import type { ReportSummary, IncompleteReportSummary, Report, AnonReportSummary } from '../data/incidentClientTypes'

import type { LoggedInUser, SystemToken } from '../types/uof'

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
    private readonly systemToken: SystemToken
  ) {}

  private async getOffenderNames(username, incidents: ReportSummary[]): Promise<NamesByOffenderNumber> {
    const token = await this.systemToken(username)
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
}
