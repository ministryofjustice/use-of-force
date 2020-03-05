const moment = require('moment')
const reminderSender = require('./reminderSender')

const notificationService = {
  sendReporterStatementReminder: jest.fn(),
  sendInvolvedStaffStatementReminder: jest.fn(),
  sendReporterStatementOverdue: jest.fn(),
  sendInvolvedStaffStatementOverdue: jest.fn(),
}

afterEach(() => {
  jest.resetAllMocks()
})

const { send } = reminderSender(notificationService)

describe('send', () => {
  const recipientEmail = 'smith@prison.org'
  const involvedName = 'June'
  const submittedDate = moment('2019-09-04 21:26:17')
  const incidentDate = moment('2019-09-05 21:26:17')
  const reporterName = 'Officer Smith'
  const now = moment('2019-09-06 21:26:17')
  const overdue = moment(now).add(-1, 'day')
  const notOverdue = moment(now).add(1, 'day')
  const statementId = -1
  const reportId = -2

  const reminder = {
    incidentDate,
    reporterName,
    recipientEmail,
    recipientName: involvedName,
    reportId,
    statementId,
    submittedDate,
  }

  const expectedContext = { reportId, statementId }

  describe('reporter', () => {
    test('sendReporterStatementReminder', async () => {
      await send({
        ...reminder,
        isReporter: true,
        nextReminderDate: now,
        overdueDate: notOverdue,
        submittedDate,
        isOverdue: false,
      })

      expect(notificationService.sendReporterStatementReminder).toBeCalledTimes(1)
      expect(notificationService.sendReporterStatementReminder).toBeCalledWith(
        recipientEmail,
        {
          incidentDate,
          overdueDate: notOverdue,
          reporterName,
          submittedDate,
        },
        expectedContext
      )
    })

    test('sendReporterStatementOverdue', async () => {
      await send({
        ...reminder,
        isReporter: true,
        nextReminderDate: now,
        overdueDate: overdue,
        isOverdue: true,
        statementId: -1,
      })

      expect(notificationService.sendReporterStatementOverdue).toBeCalledTimes(1)
      expect(notificationService.sendReporterStatementOverdue).toBeCalledWith(
        recipientEmail,
        {
          incidentDate,
          reporterName,
          submittedDate,
        },
        expectedContext
      )
    })
  })

  describe('involved staff', () => {
    test('sendInvolvedStaffStatementReminder', async () => {
      await send({
        ...reminder,
        isReporter: false,
        nextReminderDate: now,
        overdueDate: notOverdue,
        isOverdue: false,
      })

      expect(notificationService.sendInvolvedStaffStatementReminder).toBeCalledTimes(1)
      expect(notificationService.sendInvolvedStaffStatementReminder).toBeCalledWith(
        recipientEmail,
        {
          incidentDate,
          overdueDate: notOverdue,
          submittedDate,
          involvedName,
        },
        expectedContext
      )
    })

    test('sendInvolvedStaffStatementOverdue', async () => {
      await send({
        ...reminder,
        isReporter: false,
        nextReminderDate: now,
        overdueDate: overdue,
        isOverdue: true,
      })

      expect(notificationService.sendInvolvedStaffStatementOverdue).toBeCalledTimes(1)
      expect(notificationService.sendInvolvedStaffStatementOverdue).toBeCalledWith(
        recipientEmail,
        {
          incidentDate,
          submittedDate,
          involvedName,
        },
        expectedContext
      )
    })
  })
})
