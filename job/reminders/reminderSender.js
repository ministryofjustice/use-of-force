const moment = require('moment')
const logger = require('../../log')

module.exports = (notificationService, incidentClient) => {
  const isOverdue = (now, { submittedDate }) => {
    const startdate = moment(submittedDate)
    const daysSinceReportSubmitted = now.diff(startdate, 'days')
    return daysSinceReportSubmitted >= 3
  }

  const getNextReminderDate = ({ nextReminderDate }) => {
    const startdate = moment(nextReminderDate)
    return startdate.add(1, 'day').toDate()
  }

  const handleOverdue = async reminder => {
    if (reminder.isReporter) {
      await notificationService.sendReporterStatementOverdue(reminder.recipientEmail, {
        reporterName: reminder.reporterName,
        incidentDate: reminder.incidentDate,
        reportSubmittedDate: reminder.submittedDate,
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
      })
    } else {
      await notificationService.sendInvolvedStaffStatementReminder(reminder.recipientEmail, {
        involvedName: reminder.recipientName,
        incidentDate: reminder.incidentDate,
      })
    }
    const nextReminderDate = getNextReminderDate(reminder)
    await incidentClient.setNextReminderDate(reminder.statementId, nextReminderDate)
  }

  return {
    isOverdue,
    getNextReminderDate,
    send: (reminder, now = moment()) => {
      logger.info('processing reminder', reminder)

      return isOverdue(now, reminder) ? handleOverdue(reminder) : handleReminder(reminder)
    },
  }
}
