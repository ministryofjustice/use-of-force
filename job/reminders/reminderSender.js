const moment = require('moment')
const logger = require('../../log')

module.exports = (notificationService, incidentClient) => {
  const getNextReminderDate = ({ nextReminderDate }) => {
    const startdate = moment(nextReminderDate)
    return startdate.add(1, 'day').toDate()
  }

  const handleOverdue = async reminder => {
    if (reminder.isReporter) {
      await notificationService.sendReporterStatementOverdue(reminder.recipientEmail, {
        reporterName: reminder.reporterName,
        incidentDate: reminder.incidentDate,
      })
    } else {
      await notificationService.sendInvolvedStaffStatementOverdue(reminder.recipientEmail, {
        involvedName: reminder.recipientName,
        incidentDate: reminder.incidentDate,
      })
    }
    await incidentClient.setNextReminderDate(reminder.statementId, null)
  }

  const handleReminder = async reminder => {
    if (reminder.isReporter) {
      await notificationService.sendReporterStatementReminder(reminder.recipientEmail, {
        reporterName: reminder.reporterName,
        incidentDate: reminder.incidentDate,
        overdueDate: reminder.overdueDate,
      })
    } else {
      await notificationService.sendInvolvedStaffStatementReminder(reminder.recipientEmail, {
        involvedName: reminder.recipientName,
        incidentDate: reminder.incidentDate,
        overdueDate: reminder.overdueDate,
      })
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
