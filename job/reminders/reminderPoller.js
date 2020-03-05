/* eslint-disable no-await-in-loop */
const moment = require('moment')
const logger = require('../../log')

module.exports = (db, incidentClient, reminderSender, emailResolver) => {
  const Status = { REMINDER_SENT: 0, REMINDER_NOT_SENT: 1, COMPLETE: 2 }

  const getNextReminderDate = ({ nextReminderDate }) => {
    const startdate = moment(nextReminderDate)
    return startdate.add(1, 'day').toDate()
  }

  const setNextPollTime = async (client, reminder) => {
    const nextReminderDate = reminder.isOverdue ? null : getNextReminderDate(reminder)
    logger.info(
      `Setting next reminder date of: '${nextReminderDate}' for staff: '${reminder.userId}', statementId: '${reminder.statementId}'`
    )
    await incidentClient.setNextReminderDate(reminder.statementId, nextReminderDate, client)
  }

  const processReminder = async client => {
    const reminder = await incidentClient.getNextNotificationReminder(client)

    if (!reminder) {
      logger.info('No more reminders to process')
      return Status.COMPLETE
    }

    if (reminder.recipientEmail) {
      logger.info('Found reminder', reminder)
      await reminderSender.send(reminder)
      await setNextPollTime(client, reminder)
      return Status.REMINDER_SENT
    }

    const found = await emailResolver.resolveEmail(client, reminder.userId, reminder.reportId)
    if (!found) {
      // If email has been resolved then we will allow this to be processed normally on the next claim
      // otherwise, we will check again at the next eligible poll time (or never, if now overdue)
      await setNextPollTime(client, reminder)
    }
    return Status.REMINDER_NOT_SENT
  }

  return async () => {
    let currentStatus = null
    let totalSent = 0

    while (currentStatus !== Status.COMPLETE && totalSent < 50) {
      currentStatus = await db.inTransaction(processReminder)
      totalSent += currentStatus === Status.REMINDER_SENT ? 1 : 0
    }

    return totalSent
  }
}
