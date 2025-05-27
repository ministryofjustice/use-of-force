import type { AgencyId } from '../types/uof'
import type { IncidentSearchQuery, IncompleteReportSummary, Report, ReportSummary } from '../data/incidentClientTypes'
import { PageResponse, toPage } from '../utils/page'
import { IncidentClient, StatementsClient, ManageUsersApiClient } from '../data'
import OffenderService from './offenderService'
import { AdditionalComment, ReviewerStatement } from '../data/statementsClientTypes'
import AuthService from './authService'

export interface IncidentSummary {
  id: number
  bookingId: number
  incidentdate: Date
  staffMemberName: string
  isOverdue: boolean
  isRemovalRequested: boolean
  offenderName: string
  offenderNo: string
}

interface NamesByOffenderNumber {
  [offenderNo: string]: string
}
const toIncidentSummary =
  (namesByOffenderNumber: NamesByOffenderNumber) =>
  (reportSummary: ReportSummary | IncompleteReportSummary): IncidentSummary => ({
    id: reportSummary.id,
    bookingId: reportSummary.bookingId,
    incidentdate: reportSummary.incidentDate,
    staffMemberName: reportSummary.reporterName,
    isOverdue: 'isOverdue' in reportSummary ? reportSummary?.isOverdue : false,
    isRemovalRequested: 'isRemovalRequested' in reportSummary ? reportSummary?.isRemovalRequested : false,
    offenderName: namesByOffenderNumber[reportSummary.offenderNo],
    offenderNo: reportSummary.offenderNo,
  })

type Predicate<T> = (t: T) => boolean

const offenderNameFilter = (nameToMatch?: string): Predicate<IncidentSummary> => {
  const safeString = nameToMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regexp = new RegExp(`^.*${safeString}.*$`, 'i')
  return incidentSummary => regexp.test(incidentSummary.offenderName)
}

export interface ReportQuery extends IncidentSearchQuery {
  prisonerName?: string
}

export type ReviewerStatementWithComments = ReviewerStatement & {
  additionalComments: AdditionalComment[]
  isVerified: boolean
}

export default class ReviewService {
  constructor(
    private readonly statementsClient: StatementsClient,
    private readonly incidentClient: IncidentClient,
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly offenderService: OffenderService,
    private readonly authService: AuthService
  ) {}

  async getReport(reportId: number): Promise<Report> {
    const report = await this.incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }
    return report
  }

  async getOffenderNames(username: string, incidents: ReportSummary[]): Promise<NamesByOffenderNumber> {
    const token = await this.authService.getSystemClientToken(username)
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return this.offenderService.getOffenderNames(token, offenderNos)
  }

  async getCompletedReports(
    username: string,
    agencyId: AgencyId,
    query: ReportQuery,
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

  async getStatements(token: string, reportId: number): Promise<ReviewerStatementWithComments[]> {
    const statements = await this.statementsClient.getStatementsForReviewer(reportId)
    return Promise.all(statements.map(statement => this.decorateStatement(statement, token)))
  }

  async getStatement(token: string, statementId: number): Promise<ReviewerStatementWithComments> {
    const statement = await this.statementsClient.getStatementForReviewer(statementId)
    if (!statement) {
      throw new Error(`Statement: '${statementId}' does not exist`)
    }
    return this.decorateStatement(statement, token)
  }

  private async decorateStatement(statement: ReviewerStatement, token: string) {
    return Promise.all([
      this.statementsClient.getAdditionalComments(statement.id),
      this.manageUsersApiClient.getEmail(statement.userId, token),
    ]).then(([additionalComments, email]) => ({ ...statement, additionalComments, isVerified: email.verified }))
  }
}
