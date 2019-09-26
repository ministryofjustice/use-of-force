/* eslint-disable no-await-in-loop */
module.exports = (db, incidentClient, sendReminder, eventPublisher) => {
  const processReminder = async () => {
    const reminder = await incidentClient.getNextNotificationReminder()
    if (reminder) {
      await sendReminder(reminder)
    }
    return reminder
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
