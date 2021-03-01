import logger from '../../log'
import { StatementStatus, ReportStatus } from '../config/types'
import statementConfig from '../config/forms/statementForm'
import { processInput } from './validation'
import type { InTransaction } from '../data/dataAccess/db'
import type { StatementsClient, IncidentClient } from '../data'
import { PageResponse } from '../utils/page'
import { StatementWithComments, Status, StatementSummary } from './statementServiceTypes'
import { StatementUpdate } from '../data/statementsClientTypes'

type Error = { href: string; text: string }

export default class StatementService {
  constructor(
    private readonly statementsClient: StatementsClient,
    private readonly incidentClient: IncidentClient,
    private readonly inTransaction: InTransaction
  ) {}

  getStatements(userId: string, page: number): Promise<PageResponse<StatementSummary>> {
    return this.statementsClient.getStatements(userId, page)
  }

  async getStatementForUser(userId: string, reportId: number, status: Status): Promise<StatementWithComments> {
    const statement = await this.statementsClient.getStatementForUser(userId, reportId, status)
    if (!statement) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }
    const additionalComments = await this.statementsClient.getAdditionalComments(statement.id)
    return { additionalComments, ...statement }
  }

  async validateSavedStatement(username: string, reportId: number): Promise<Error[]> {
    const statement = await this.getStatementForUser(username, reportId, StatementStatus.PENDING)

    const result = processInput({ validationSpec: statementConfig.complete, input: statement })
    return result.errors || []
  }

  async save(userId: string, reportId: number, statement: StatementUpdate): Promise<void> {
    logger.info(`Saving statement for user: ${userId} and report: ${reportId}`)
    await this.statementsClient.saveStatement(userId, reportId, statement)
  }

  async submitStatement(userId: string, reportId: number): Promise<void> {
    logger.info(`Submitting statement for user: ${userId} and report: ${reportId}`)

    await this.inTransaction(async client => {
      await this.statementsClient.submitStatement(userId, reportId, client)

      const pendingStatementCount = await this.statementsClient.getNumberOfPendingStatements(reportId, client)

      if (pendingStatementCount === 0) {
        logger.info(`All statements complete on : ${reportId}, marking as complete`)
        await this.incidentClient.changeStatus(reportId, ReportStatus.SUBMITTED, ReportStatus.COMPLETE, client)
      }
    })
  }

  async saveAdditionalComment(statementId: number, additionalComment: string): Promise<void> {
    logger.info(`Saving additional comment for statement with id: ${statementId}`)
    await this.statementsClient.saveAdditionalComment(statementId, additionalComment)
  }
}
