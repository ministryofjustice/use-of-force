const reminderPoller = require('./reminderPoller')

const sendReminder = jest.fn()

const db = {
  inTransaction: async callback => {
    const result = await callback()
    return result
  },
}

const incidentClient = {
  getNextNotificationReminder: jest.fn(),
}

const poll = reminderPoller(db, incidentClient, sendReminder)

describe('poll for reminders', () => {
  test('no reminders', async () => {
    const count = await poll()

    expect(count).toEqual(0)
  })
  test('successfully poll one reminder', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({ reminder: 1 })

    const count = await poll()

    expect(count).toEqual(1)
  })
  test('infinite reminders - only process 100 reminders in one go', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValue({ reminder: 1 })

    const count = await poll()

    expect(count).toEqual(100)
  })
})
