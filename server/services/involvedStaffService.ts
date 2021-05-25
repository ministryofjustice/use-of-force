import moment from 'moment'
import logger from '../../log'
import { ReportStatus } from '../config/types'
import type { IncidentClient, StatementsClient } from '../data'
import type { InTransaction } from '../data/dataAccess/db'
import type UserService from './userService'
import { InvolvedStaff } from '../data/incidentClientTypes'
import { RemovalRequest } from '../data/statementsClientTypes'

export enum AddStaffResult {
  SUCCESS = 'success',
  SUCCESS_UNVERIFIED = 'unverified',
  MISSING = 'missing',
  ALREADY_EXISTS = 'already-exists',
}

export class InvolvedStaffService {
  constructor(
    private readonly incidentClient: IncidentClient,
    private readonly statementsClient: StatementsClient,
    private readonly userService: UserService,
    private readonly inTransaction: InTransaction,
    private readonly notificationService
  ) {}

  public getInvolvedStaff(reportId: number): Promise<InvolvedStaff[]> {
    return this.incidentClient.getInvolvedStaff(reportId)
  }

  public async getInvolvedStaffRemovalRequest(statementId: number): Promise<RemovalRequest> {
    const removalRequest = await this.statementsClient.getRemovalRequest(statementId)
    return removalRequest
  }

  public async loadInvolvedStaff(reportId: number, statementId: number): Promise<InvolvedStaff> {
    const involvedStaff = await this.incidentClient.getInvolvedStaff(reportId)
    const found = involvedStaff.find(staff => staff.statementId === statementId)
    if (!found) {
      throw new Error(`Staff with id: ${statementId}, does not exist on report: '${reportId}'`)
    }
    return found
  }

  public async loadInvolvedStaffByUsername(reportId: number, username: string): Promise<InvolvedStaff> {
    const involvedStaff = await this.incidentClient.getInvolvedStaff(reportId)
    const found = involvedStaff.find(staff => staff.userId === username)
    if (!found) {
      throw new Error(`Staff with username: ${username}, does not exist on report: '${reportId}'`)
    }
    return found
  }

  public async addInvolvedStaff(token: string, reportId: number, username: string): Promise<AddStaffResult> {
    logger.info(`Adding involved staff with username: ${username} to report: '${reportId}'`)

    const foundUser = await this.userService.getUser(token, username)

    if (!foundUser.exists) {
      return AddStaffResult.MISSING
    }

    logger.info(`found staff: '${foundUser}'`)

    const report = await this.incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }

    if (await this.statementsClient.isStatementPresentForUser(reportId, username)) {
      return AddStaffResult.ALREADY_EXISTS
    }

    return this.inTransaction(async client => {
      await this.statementsClient.createStatements(
        reportId,
        null,
        moment(report.submittedDate).add(3, 'day').toDate(),
        [foundUser],
        client
      )

      if (report.status === ReportStatus.COMPLETE.value) {
        logger.info(`There are now pending statements on : ${reportId}, moving from 'COMPLETE' to 'SUBMITTED'`)
        // TODO provide real username
        await this.incidentClient.changeStatus(
          reportId,
          'SYSTEM',
          ReportStatus.COMPLETE,
          ReportStatus.SUBMITTED,
          client
        )
      }
      return foundUser.verified ? AddStaffResult.SUCCESS : AddStaffResult.SUCCESS_UNVERIFIED
    })
  }

  public async removeInvolvedStaff(reportId: number, statementId: number): Promise<void> {
    logger.info(`Removing statement: ${statementId} from report: ${reportId}`)

    const involvedStaff = await this.statementsClient.getInvolvedStaffToRemove(statementId)

    await this.inTransaction(async client => {
      const pendingStatementBeforeDeletion = await this.statementsClient.getNumberOfPendingStatements(reportId, client)

      await this.statementsClient.deleteStatement({
        statementId,
        query: client,
      })

      if (pendingStatementBeforeDeletion !== 0) {
        const pendingStatementCount = await this.statementsClient.getNumberOfPendingStatements(reportId, client)

        if (pendingStatementCount === 0) {
          // TODO provide real username
          logger.info(`All statements complete on : ${reportId}, marking as complete`)
          await this.incidentClient.changeStatus(
            reportId,
            'SYSTEM',
            ReportStatus.SUBMITTED,
            ReportStatus.COMPLETE,
            client
          )
        }
      }
    })

    const { submittedDate, email, name: involvedName } = involvedStaff
    const incidentDate = moment(involvedStaff.incidentDate).toDate()
    const context = { reportId, statementId }

    await this.notificationService.sendInvolvedStaffRemovedFromReport(
      email,
      { involvedName, incidentDate, submittedDate },
      context
    )
  }
}
