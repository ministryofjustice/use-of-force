import logger from '../../log'

export default class ReminderService {
  constructor(private readonly notificationService: any) {}

  private context = ({ statementId, reportId }) => ({ statementId, reportId })

  private async handleOverdue(reminder): Promise<void> {
    if (reminder.isReporter) {
      await this.notificationService.sendReporterStatementOverdue(
        reminder.recipientEmail,
        {
          reporterName: reminder.reporterName,
          incidentDate: reminder.incidentDate,
          submittedDate: reminder.submittedDate,
        },
        this.context(reminder)
      )
    } else {
      await this.notificationService.sendInvolvedStaffStatementOverdue(
        reminder.recipientEmail,
        {
          involvedName: reminder.recipientName,
          incidentDate: reminder.incidentDate,
          submittedDate: reminder.submittedDate,
        },
        this.context(reminder)
      )
    }
  }

  private async handleReminder(reminder) {
    if (reminder.isReporter) {
      await this.notificationService.sendReporterStatementReminder(
        reminder.recipientEmail,
        {
          reporterName: reminder.reporterName,
          incidentDate: reminder.incidentDate,
          overdueDate: reminder.overdueDate,
          submittedDate: reminder.submittedDate,
        },
        this.context(reminder)
      )
    } else {
      await this.notificationService.sendInvolvedStaffStatementReminder(
        reminder.recipientEmail,
        {
          involvedName: reminder.recipientName,
          incidentDate: reminder.incidentDate,
          overdueDate: reminder.overdueDate,
          submittedDate: reminder.submittedDate,
        },
        this.context(reminder)
      )
    }
  }

  public async send(reminder): Promise<void> {
    logger.info('processing reminder', reminder)
    if (reminder.isOverdue) {
      await this.handleOverdue(reminder)
    } else {
      await this.handleReminder(reminder)
    }
  }
}
