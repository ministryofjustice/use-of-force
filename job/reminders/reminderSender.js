const logger = require('../../log')

module.exports = notificationService => {
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
  }

  return {
    send: async reminder => {
      logger.info('processing reminder', reminder)
      if (reminder.isOverdue) {
        await handleOverdue(reminder)
      } else {
        await handleReminder(reminder)
      }
    },
  }
}
