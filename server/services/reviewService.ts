import { IncidentClient } from '../data/incidentClient'
import { AgencyId } from '../types/uof'
import { IncidentSearchQuery } from '../data/incidentClientTypes'

export default class ReviewService {
  statementsClient

  incidentClient: IncidentClient

  authClientBuilder

  constructor(statementsClient, incidentClient: IncidentClient, authClientBuilder) {
    this.statementsClient = statementsClient
    this.incidentClient = incidentClient
    this.authClientBuilder = authClientBuilder
  }

  private async statementsWithVerifiedInfo(token: string, statements: any[]): Promise<any[]> {
    const authClient = this.authClientBuilder(token)
    const results = statements.map(statement =>
      authClient.getEmail(statement.userId).then(email => ({ ...statement, isVerified: email.verified }))
    )
    return Promise.all(results)
  }

  async getReport(reportId) {
    const report = await this.incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }
    return report
  }

  async getReports(agencyId: AgencyId, query: IncidentSearchQuery = {}) {
    const awaiting = await this.incidentClient.getIncompleteReportsForReviewer(agencyId, query)
    const completed = await this.incidentClient.getCompletedReportsForReviewer(agencyId, query)

    return { awaiting, completed }
  }

  async getStatements(token, reportId) {
    const statements = await this.statementsClient.getStatementsForReviewer(reportId)
    return this.statementsWithVerifiedInfo(token, statements)
  }

  async getStatement(statementId) {
    const statement = await this.statementsClient.getStatementForReviewer(statementId)
    if (!statement) {
      throw new Error(`Statement: '${statementId}' does not exist`)
    }
    const additionalComments = await this.statementsClient.getAdditionalComments(statement.id)
    return { additionalComments, ...statement }
  }
}
