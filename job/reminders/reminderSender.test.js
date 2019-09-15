const moment = require('moment')
const reminderSender = require('./reminderSender')

const notificationService = {
  sendReporterStatementReminder: jest.fn(),
  sendInvolvedStaffStatementReminder: jest.fn(),
  sendReporterStatementOverdue: jest.fn(),
  sendInvolvedStaffStatementOverdue: jest.fn(),
}

const incidentClient = {
  setNextReminderDate: jest.fn(),
}

afterEach(() => {
  jest.resetAllMocks()
})

const { getNextReminderDate, send } = reminderSender(notificationService, incidentClient)

describe('getNextReminderDate', () => {
  const checkGetNextReminderDate = val =>
    expect(moment(getNextReminderDate({ nextReminderDate: moment(val) })).format('YYYY-MM-DD HH:mm:ss'))

  test('normal day', async () => {
    checkGetNextReminderDate('2019-09-06 21:26:17').toEqual('2019-09-07 21:26:17')
  })

  test('end of month', async () => {
    checkGetNextReminderDate('2019-09-30 21:26:17').toEqual('2019-10-01 21:26:17')
  })

  test('leap year', async () => {
    checkGetNextReminderDate('2020-02-28 23:59:59').toEqual('2020-02-29 23:59:59')
    checkGetNextReminderDate('2020-02-29 23:59:59').toEqual('2020-03-01 23:59:59')
  })
})

describe('send', () => {
  const recipientEmail = 'smith@prison.org'
  const involvedName = 'June'
  const incidentDate = moment('2019-09-05 21:26:17')
  const reporterName = 'Officer Smith'
  const now = moment('2019-09-06 21:26:17')
  const overdue = moment(now).add(-1, 'day')
  const notOverdue = moment(now).add(1, 'day')

  describe('reporter', () => {
    test('sendReporterStatementReminder', async () => {
      await send(
        {
          isReporter: true,
          incidentDate,
          reporterName,
          recipientEmail,
          nextReminderDate: now,
          overdueDate: notOverdue,
          isOverdue: false,
          statementId: -1,
        },
        now
      )

      expect(notificationService.sendReporterStatementReminder).toBeCalledTimes(1)
      expect(notificationService.sendReporterStatementReminder).toBeCalledWith(recipientEmail, {
        incidentDate,
        overdueDate: notOverdue,
        reporterName,
      })

      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, moment('2019-09-07 21:26:17').toDate())
    })

    test('sendReporterStatementOverdue', async () => {
      await send(
        {
          isReporter: true,
          incidentDate,
          reporterName,
          recipientEmail,
          nextReminderDate: now,
          overdueDate: overdue,
          isOverdue: true,
          statementId: -1,
        },
        now
      )

      expect(notificationService.sendReporterStatementOverdue).toBeCalledTimes(1)
      expect(notificationService.sendReporterStatementOverdue).toBeCalledWith(recipientEmail, {
        incidentDate,
        reporterName,
      })

      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, null)
    })
  })

  describe('involved staff', () => {
    test('sendInvolvedStaffStatementReminder', async () => {
      await send(
        {
          isReporter: false,
          incidentDate,
          reporterName,
          recipientEmail,
          recipientName: involvedName,
          nextReminderDate: now,
          overdueDate: notOverdue,
          isOverdue: false,
          statementId: -1,
        },
        now
      )

      expect(notificationService.sendInvolvedStaffStatementReminder).toBeCalledTimes(1)
      expect(notificationService.sendInvolvedStaffStatementReminder).toBeCalledWith(recipientEmail, {
        incidentDate,
        overdueDate: notOverdue,
        involvedName,
      })

      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, moment('2019-09-07 21:26:17').toDate())
    })

    test('sendInvolvedStaffStatementOverdue', async () => {
      await send(
        {
          isReporter: false,
          incidentDate,
          reporterName,
          recipientEmail,
          recipientName: involvedName,
          nextReminderDate: now,
          overdueDate: overdue,
          isOverdue: true,
          statementId: -1,
        },
        now
      )

      expect(notificationService.sendInvolvedStaffStatementOverdue).toBeCalledTimes(1)
      expect(notificationService.sendInvolvedStaffStatementOverdue).toBeCalledWith(recipientEmail, {
        incidentDate,
        involvedName,
      })

      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, null)
    })
  })
})
