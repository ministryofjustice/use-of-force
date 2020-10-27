import moment from 'moment'
import IncidentClient from '../../server/data/incidentClient'
import reminderPoller from './reminderPoller'
import ReminderSender from './reminderSender'
import EmailResolver from './emailResolver'

const client = 'client-1'
const inTransaction = fn => fn(client)

jest.mock('../../server/data/incidentClient')
jest.mock('./reminderSender')
jest.mock('./emailResolver')

const incidentClient = new IncidentClient(null, null) as jest.Mocked<IncidentClient>
const reminderSender = new ReminderSender(null) as jest.Mocked<ReminderSender>
const emailResolver = new EmailResolver(null, null, null) as jest.Mocked<EmailResolver>

const poll = reminderPoller(inTransaction, incidentClient, reminderSender, emailResolver)

afterEach(() => {
  jest.resetAllMocks()
})

describe('poll for reminders', () => {
  test('no reminders', async () => {
    const count = await poll()

    expect(count).toEqual(0)
    expect(reminderSender.send).toBeCalledTimes(0)
  })

  test('successfully poll one reminder', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({ reminder: 1, recipientEmail: 'user@gov.uk' })

    const count = await poll()

    expect(count).toEqual(1)
    expect(reminderSender.send).toBeCalledTimes(1)
  })

  test('process reminders for unverified user', async () => {
    incidentClient.getNextNotificationReminder
      .mockResolvedValueOnce({
        statementId: 1,
        nextReminderDate: moment('2019-01-10 10:30:43.122'),
        reportId: 2,
        userId: 'BOB',
      })
      .mockResolvedValueOnce({
        statementId: 2,
        nextReminderDate: moment('2019-01-10 10:32:43.122'),
        reportId: 3,
        userId: 'BARRY',
        recipientEmail: 'user@gov.uk',
      })

    emailResolver.resolveEmail.mockResolvedValue(null)

    const count = await poll()

    expect(count).toEqual(1)
    expect(reminderSender.send).toBeCalledTimes(1)

    expect(emailResolver.resolveEmail).toHaveBeenCalledWith(client, 'BOB', 2)
    expect(incidentClient.setNextReminderDate).toHaveBeenCalledWith(
      1,
      moment('2019-01-11T10:30:43.122Z').toDate(),
      client
    )
    expect(incidentClient.setNextReminderDate).toHaveBeenCalledWith(
      2,
      moment('2019-01-11T10:32:43.122Z').toDate(),
      client
    )
  })

  test('Overdue reminder for unverified user leads to never reminding again', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({
      statementId: 1,
      nextReminderDate: moment('2019-01-10 10:30:43.122'),
      reportId: 2,
      userId: 'BOB',
      isOverdue: true,
    })

    emailResolver.resolveEmail.mockResolvedValue(null)

    const count = await poll()

    expect(count).toEqual(0)
    expect(reminderSender.send).toBeCalledTimes(0)

    expect(emailResolver.resolveEmail).toHaveBeenCalledWith(client, 'BOB', 2)
    expect(incidentClient.setNextReminderDate).toHaveBeenCalledWith(1, null, client)
  })

  test('Overdue reminder for verified user leads to allowing to pick up on next poll', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({
      statementId: 1,
      nextReminderDate: moment('2019-01-10 10:30:43.122'),
      reportId: 2,
      userId: 'BOB',
      isOverdue: true,
    })

    emailResolver.resolveEmail.mockResolvedValue(true)

    const count = await poll()

    expect(count).toEqual(0)
    expect(reminderSender.send).toBeCalledTimes(0)

    expect(emailResolver.resolveEmail).toHaveBeenCalledWith(client, 'BOB', 2)
    expect(incidentClient.setNextReminderDate).not.toHaveBeenCalled()
  })

  test('process reminder for recently verified user', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValueOnce({ reminder: 1, reportId: 2, userId: 'BOB' })
    emailResolver.resolveEmail.mockResolvedValue(true)

    const count = await poll()

    expect(count).toEqual(0)
    expect(reminderSender.send).toBeCalledTimes(0)
    expect(emailResolver.resolveEmail).toHaveBeenCalledWith(client, 'BOB', 2)
    expect(incidentClient.setNextReminderDate).not.toHaveBeenCalled()
  })

  test('infinite reminders - only process 50 reminders in one go', async () => {
    incidentClient.getNextNotificationReminder.mockResolvedValue({ reminder: 1, recipientEmail: 'user@gov.uk' })

    const count = await poll()

    expect(count).toEqual(50)
    expect(reminderSender.send).toBeCalledTimes(50)
  })
})
