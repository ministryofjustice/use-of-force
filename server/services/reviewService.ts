import type IncidentClient from '../data/incidentClient'
import type { AgencyId, OffenderService, SystemToken } from '../types/uof'
import type { IncidentSearchQuery, IncompleteReportSummary, ReportSummary } from '../data/incidentClientTypes'
import { PageResponse, toPage } from '../utils/page'
import StatementsClient from '../data/statementsClient'

export interface IncidentSummary {
  id: number
  bookingId: number
  incidentdate: Date
  staffMemberName: string
  isOverdue: boolean
  offenderName: string
  offenderNo: string
}

interface NamesByOffenderNumber {
  [offenderNo: string]: string
}
const toIncidentSummary = (namesByOffenderNumber: NamesByOffenderNumber) => (
  reportSummary: ReportSummary | IncompleteReportSummary
): IncidentSummary => ({
  id: reportSummary.id,
  bookingId: reportSummary.bookingId,
  incidentdate: reportSummary.incidentDate,
  staffMemberName: reportSummary.reporterName,
  isOverdue: 'isOverdue' in reportSummary ? reportSummary?.isOverdue : false,
  offenderName: namesByOffenderNumber[reportSummary.offenderNo],
  offenderNo: reportSummary.offenderNo,
})

// Surely this is defined somewhere useful? In a base set of typescript types perhaps?
interface Predicate<T> {
  (x: T): boolean
}

const offenderNameFilter = (nameToMatch?: string): Predicate<IncidentSummary> => {
  const regexp = new RegExp(`^.*${nameToMatch}.*$`, 'i')
  return incidentSummary => regexp.test(incidentSummary.offenderName)
}

export interface ReportQuery extends IncidentSearchQuery {
  prisonerName?: string
}

export default class ReviewService {
  private readonly statementsClient

  private readonly incidentClient: IncidentClient

  private readonly authClientBuilder

  private readonly offenderService: OffenderService

  private readonly systemToken: SystemToken

  constructor(
    statementsClient: StatementsClient,
    incidentClient: IncidentClient,
    authClientBuilder,
    offenderService: OffenderService,
    systemToken: SystemToken
  ) {
    this.statementsClient = statementsClient
    this.incidentClient = incidentClient
    this.authClientBuilder = authClientBuilder
    this.offenderService = offenderService
    this.systemToken = systemToken
  }

  private async statementsWithVerifiedInfo(token: string, statements: any[]): Promise<any[]> {
    const authClient = this.authClientBuilder(token)
    const results = statements.map(statement =>
      authClient.getEmail(statement.userId).then(email => ({ ...statement, isVerified: email.verified }))
    )
    return Promise.all(results)
  }

  async getReport(reportId: number) {
    const report = await this.incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }
    return report
  }

  async getOffenderNames(username: string, incidents: ReportSummary[]): Promise<NamesByOffenderNumber> {
    const token = await this.systemToken(username)
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return this.offenderService.getOffenderNames(token, offenderNos)
  }

  async getCompletedReports(
    username: string,
    agencyId: AgencyId,
    query: ReportQuery = {},
    page: number
  ): Promise<PageResponse<IncidentSummary>> {
    if (query.prisonerName) {
      // when searching by prisoner name, we can't filter paged results as we would end up with odd/empty shaped pages. So have to load all and page in memory
      const reports = await this.incidentClient.getAllCompletedReportsForReviewer(agencyId, query)
      const namesByOffenderNumber = await this.getOffenderNames(username, reports)
      const filtered = reports
        .map(toIncidentSummary(namesByOffenderNumber))
        .filter(offenderNameFilter(query.prisonerName))
      return toPage(page, filtered)
    }
    const reports = await this.incidentClient.getCompletedReportsForReviewer(agencyId, query, page)
    const namesByOffenderNumber = await this.getOffenderNames(username, reports.items)
    return reports.map(toIncidentSummary(namesByOffenderNumber))
  }

  async getIncompleteReports(username: string, agencyId: AgencyId): Promise<IncidentSummary[]> {
    const incomplete = await this.incidentClient.getIncompleteReportsForReviewer(agencyId)
    const namesByOffenderNumber = await this.getOffenderNames(username, incomplete)
    return incomplete.map(toIncidentSummary(namesByOffenderNumber))
  }

  async getStatements(token: string, reportId: number) {
    const statements = await this.statementsClient.getStatementsForReviewer(reportId)
    return this.statementsWithVerifiedInfo(token, statements)
  }

  async getStatement(statementId: number) {
    const statement = await this.statementsClient.getStatementForReviewer(statementId)
    if (!statement) {
      throw new Error(`Statement: '${statementId}' does not exist`)
    }
    const additionalComments = await this.statementsClient.getAdditionalComments(statement.id)
    return { additionalComments, ...statement }
  }
}
