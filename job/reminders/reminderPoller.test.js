const reminderPoller = require('./reminderPoller')

const reminderSender = { sendReminder: jest.fn(), setNextReminderDate: jest.fn() }

const eventPublisher = { publish: jest.fn() }
const client = { inTransaction: true }

const db = {
  inTransaction: async callback => {
    const result = await callback(client)
    return result
  },
}

const incidentClient = {
  getNextNotificationReminder: jest.fn(),
}

const emailResolver = {
  resolveEmail: jest.fn(),
}

const poll = reminderPoller(db, incidentClient, reminderSender, eventPublisher, emailResolver)

afterEach(() => {
  jest.resetAllMocks()
})

describe('poll for reminders', () => {
  test('no reminders', async () => {
    const count = await poll()

    expect(count).toEqual(0)
    expect(reminderSender.sendReminder).toBeCalledTimes(0)

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
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({ reminder: 1, email: 'user@gov.uk' })

    const count = await poll()

    expect(count).toEqual(1)
    expect(reminderSender.sendReminder).toBeCalledTimes(1)

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

  test('process reminder for unverified user', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({ reminder: 1, reportId: 2, userId: 'BOB' })
    emailResolver.resolveEmail.mockResolvedValue(null)

    const count = await poll()

    expect(count).toEqual(0)
    expect(reminderSender.sendReminder).toBeCalledTimes(0)

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
    expect(reminderSender.setNextReminderDate).toBeCalledTimes(1)
    expect(emailResolver.resolveEmail).toHaveBeenCalledWith(client, 'BOB', 2)
  })

  test('process reminder for recently verified user', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({ reminder: 1, reportId: 2, userId: 'BOB' })
    emailResolver.resolveEmail.mockResolvedValue('user@gov.uk')

    const count = await poll()

    expect(count).toEqual(1)
    expect(reminderSender.sendReminder).toBeCalledTimes(1)

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
    expect(emailResolver.resolveEmail).toHaveBeenCalledWith(client, 'BOB', 2)
  })

  test('infinite reminders - only process 50 reminders in one go', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValue({ reminder: 1, email: 'user@gov.uk' })

    const count = await poll()

    expect(count).toEqual(50)
    expect(reminderSender.sendReminder).toBeCalledTimes(50)

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
