/* eslint-disable no-await-in-loop */
const logger = require('../../log')

module.exports = (db, incidentClient, reminderSender, eventPublisher, emailResolver) => {
  const processReminder = async client => {
    const reminder = await incidentClient.getNextNotificationReminder(client)
    logger.info('Found reminder reminder', reminder)
    if (reminder && reminder.email) {
      await reminderSender.sendReminder(client, reminder)
      return reminder
    }

    if (reminder) {
      // Check to see if email has been verified since last poll
      const email = await emailResolver.resolveEmail(client, reminder.userId, reminder.reportId)
      logger.info('Checking to see if previously unverified user now has verified email', reminder)

      if (email) {
        logger.info('Found verified email')
        await reminderSender.sendReminder(client, reminder)
        return reminder
      }

      logger.info(`User still not verified`)
      await reminderSender.setNextReminderDate(client, reminder)
    }

    return null
  }

  return async () => {
    eventPublisher.publish({ name: 'StartingToSendReminders' })

    let result = true
    let count = 0

    while (result && count < 50) {
      result = await db.inTransaction(processReminder)
      count += result ? 1 : 0
    }

    eventPublisher.publish({ name: 'FinishedSendingReminders', properties: { totalSent: count } })
    return count
  }
}
