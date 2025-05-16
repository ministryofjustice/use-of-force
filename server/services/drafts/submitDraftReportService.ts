import moment, { Moment } from 'moment'

import type { DraftReportClient, StatementsClient } from '../../data'
import logger from '../../../log'
import { InTransaction } from '../../data/dataAccess/db'
import { LoggedInUser } from '../../types/uof'
import { DraftInvolvedStaff } from './draftInvolvedStaffService'

export type PersistedInvolvedStaff = DraftInvolvedStaff & { statementId: number }

export default class SubmitDraftReportService {
  constructor(
    private readonly draftReportClient: DraftReportClient,
    private readonly statementsClient: StatementsClient,
    private readonly notificationService,
    private readonly inTransaction: InTransaction
  ) {}

  private async requestStatements(
    reportId: number,
    currentUser: LoggedInUser,
    incidentDate: Moment,
    overdueDate: Moment,
    submittedDate: Moment,
    staffMembers: PersistedInvolvedStaff[]
  ) {
    const staffExcludingReporter = staffMembers.filter(staff => !staff.isReporter)
    const staffExcludingUnverified = staffExcludingReporter.filter(staff => staff.email)
    const notifications = staffExcludingUnverified.map(staff =>
      this.notificationService.sendStatementRequest(
        staff.email,
        {
          involvedName: staff.name,
          reporterName: currentUser.displayName,
          incidentDate: incidentDate.toDate(),
          overdueDate: overdueDate.toDate(),
          submittedDate: submittedDate.toDate(),
        },
        { reportId, statementId: staff.statementId }
      )
    )
    return Promise.all(notifications)
  }

  public async submit(
    currentUser: LoggedInUser,
    bookingId: number,
    involvedStaff: DraftInvolvedStaff[],
    now: () => Moment = () => moment()
  ): Promise<number | false> {
    const { id: reportId, incidentDate } = await this.draftReportClient.get(currentUser.username, bookingId)
    if (reportId) {
      const reportSubmittedDate = now()
      const overdueDate = moment(reportSubmittedDate).add(3, 'days')

      const staff = await this.inTransaction(async client => {
        const userNamesToStatementIds = await this.statementsClient.createStatements(
          reportId,
          moment(reportSubmittedDate).add(1, 'day').toDate(),
          overdueDate.toDate(),
          involvedStaff,
          client
        )
        const idFor = user => userNamesToStatementIds[user.username]
        const { username } = currentUser
        logger.info(`Submitting report for user: ${username} and booking: ${bookingId}`)
        await this.draftReportClient.submit(reportId, username, reportSubmittedDate.toDate(), client)
        return involvedStaff.map(staffMember => ({ ...staffMember, statementId: idFor(staffMember) }))
      })

      await this.requestStatements(reportId, currentUser, moment(incidentDate), overdueDate, reportSubmittedDate, staff)

      return reportId
    }
    return false
  }
}
