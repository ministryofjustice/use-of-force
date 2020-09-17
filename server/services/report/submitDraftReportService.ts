import moment, { Moment } from 'moment'

import type DraftReportClient from '../../data/draftReportClient'
import logger from '../../../log'
import { InTransaction } from '../../data/dataAccess/db'
import { InvolvedStaffService } from '../involvedStaffService'
import { LoggedInUser } from '../../types/uof'

export default class SubmitDraftReportService {
  constructor(
    private readonly draftReportClient: DraftReportClient,
    private readonly involvedStaffService: InvolvedStaffService,
    private readonly notificationService,
    private readonly inTransaction: InTransaction
  ) {}

  private async requestStatements({ reportId, currentUser, incidentDate, overdueDate, submittedDate, staffMembers }) {
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

  public async submit(
    currentUser: LoggedInUser,
    bookingId: number,
    now: () => Moment = () => moment()
  ): Promise<number | false> {
    const { id, incidentDate } = await this.draftReportClient.get(currentUser.username, bookingId)
    if (id) {
      const reportSubmittedDate = now()
      const overdueDate = moment(reportSubmittedDate).add(3, 'days')

      const staff = await this.inTransaction(async client => {
        const savedStaff = await this.involvedStaffService.save(
          bookingId,
          id,
          reportSubmittedDate,
          overdueDate,
          currentUser,
          client
        )
        logger.info(`Submitting report for user: ${currentUser.username} and booking: ${bookingId}`)
        await this.draftReportClient.submit(currentUser.username, bookingId, reportSubmittedDate.toDate(), client)
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
}
