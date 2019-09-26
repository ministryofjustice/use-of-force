const reminderPoller = require('./reminderPoller')

const sendReminder = jest.fn()

const eventPublisher = { publish: jest.fn() }

const db = {
  inTransaction: async callback => {
    const result = await callback()
    return result
  },
}

const incidentClient = {
  getNextNotificationReminder: jest.fn(),
}

const poll = reminderPoller(db, incidentClient, sendReminder, eventPublisher)

afterEach(() => {
  jest.resetAllMocks()
})

describe('poll for reminders', () => {
  test('no reminders', async () => {
    const count = await poll()

    expect(count).toEqual(0)
    expect(sendReminder).toBeCalledTimes(0)

    expect(eventPublisher.publish).toBeCalledTimes(2)
    expect(eventPublisher.publish.mock.calls).toEqual([
      [{ name: 'StartingToSendReminders' }],
      [
        {
          name: 'FinishedSendingReminders',
          properties: { totalSent: 0 },
        },
      ],
    ])
  })

  test('successfully poll one reminder', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({ reminder: 1 })

    const count = await poll()

    expect(count).toEqual(1)
    expect(sendReminder).toBeCalledTimes(1)

    expect(eventPublisher.publish).toBeCalledTimes(2)
    expect(eventPublisher.publish.mock.calls).toEqual([
      [{ name: 'StartingToSendReminders' }],
      [
        {
          name: 'FinishedSendingReminders',
          properties: { totalSent: 1 },
        },
      ],
    ])
  })

  test('infinite reminders - only process 50 reminders in one go', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValue({ reminder: 1 })

    const count = await poll()

    expect(count).toEqual(50)
    expect(sendReminder).toBeCalledTimes(50)

    expect(eventPublisher.publish).toBeCalledTimes(2)
    expect(eventPublisher.publish.mock.calls).toEqual([
      [{ name: 'StartingToSendReminders' }],
      [
        {
          name: 'FinishedSendingReminders',
          properties: { totalSent: 50 },
        },
      ],
    ])
  })
})
