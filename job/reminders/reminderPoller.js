/* eslint-disable no-await-in-loop */
module.exports = (db, incidentClient, sendReminder, eventPublisher, emailResolver) => {
  const processReminder = async client => {
    const reminder = await incidentClient.getNextNotificationReminder(client)

    if (reminder && reminder.email) {
      await sendReminder(client, reminder)
      return reminder
    }

    if (reminder) {
      // Check to see if email has been verified since last poll
      const email = await emailResolver.resolveEmail(client, reminder.userId, reminder.reportId)
      if (email) {
        await sendReminder(client, reminder)
        return reminder
      }
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
