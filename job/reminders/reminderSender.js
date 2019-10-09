const moment = require('moment')
const logger = require('../../log')

module.exports = (notificationService, incidentClient) => {
  const getNextReminderDate = ({ nextReminderDate }) => {
    const startdate = moment(nextReminderDate)
    return startdate.add(1, 'day').toDate()
  }

  const context = ({ statementId, reportId }) => ({ statementId, reportId })

  const handleOverdue = async reminder => {
    if (reminder.isReporter) {
      await notificationService.sendReporterStatementOverdue(
        reminder.recipientEmail,
        {
          reporterName: reminder.reporterName,
          incidentDate: reminder.incidentDate,
          submittedDate: reminder.submittedDate,
        },
        context(reminder)
      )
    } else {
      await notificationService.sendInvolvedStaffStatementOverdue(
        reminder.recipientEmail,
        {
          involvedName: reminder.recipientName,
          incidentDate: reminder.incidentDate,
          submittedDate: reminder.submittedDate,
        },
        context(reminder)
      )
    }
    await incidentClient.setNextReminderDate(reminder.statementId, null)
  }

  const handleReminder = async reminder => {
    if (reminder.isReporter) {
      await notificationService.sendReporterStatementReminder(
        reminder.recipientEmail,
        {
          reporterName: reminder.reporterName,
          incidentDate: reminder.incidentDate,
          overdueDate: reminder.overdueDate,
          submittedDate: reminder.submittedDate,
        },
        context(reminder)
      )
    } else {
      await notificationService.sendInvolvedStaffStatementReminder(
        reminder.recipientEmail,
        {
          involvedName: reminder.recipientName,
          incidentDate: reminder.incidentDate,
          overdueDate: reminder.overdueDate,
          submittedDate: reminder.submittedDate,
        },
        context(reminder)
      )
    }
    const nextReminderDate = getNextReminderDate(reminder)
    await incidentClient.setNextReminderDate(reminder.statementId, nextReminderDate)
  }

  return {
    getNextReminderDate,
    send: reminder => {
      logger.info('processing reminder', reminder)
      return reminder.isOverdue ? handleOverdue(reminder) : handleReminder(reminder)
    },
  }
}
