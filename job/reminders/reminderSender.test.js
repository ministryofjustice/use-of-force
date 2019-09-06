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

const { isOverdue, getNextReminderDate, send } = reminderSender(notificationService, incidentClient)

describe('isOverdue', () => {
  const checkIsOverdue = ({ now, submitted }) => expect(isOverdue(moment(now), { submittedDate: moment(submitted) }))

  test('now is not overdue', async () => {
    checkIsOverdue({ submitted: '2019-09-06 21:26:17', now: '2019-09-06 21:26:17' }).toEqual(false)
  })

  test('submitted in the future is not overdue', async () => {
    checkIsOverdue({ submitted: '2019-09-06 21:26:18Z', now: '2019-09-06 21:26:17' }).toEqual(false)
    checkIsOverdue({ submitted: '2019-09-07 21:26:17Z', now: '2019-09-06 21:26:17' }).toEqual(false)
  })

  test('check around boundary', async () => {
    checkIsOverdue({ submitted: '2019-09-06 21:26:17', now: '2019-09-09 21:26:16' }).toEqual(false)
    checkIsOverdue({ submitted: '2019-09-06 21:26:17', now: '2019-09-09 21:26:17' }).toEqual(true)
  })

  test('check submitted around leap year', async () => {
    checkIsOverdue({ submitted: '2020-02-28 23:59:59', now: '2020-03-02 23:59:58' }).toEqual(false)
    checkIsOverdue({ submitted: '2020-02-28 23:59:59', now: '2020-03-02 23:59:59' }).toEqual(true)

    checkIsOverdue({ submitted: '2020-02-29 23:59:59', now: '2020-03-03 23:59:58' }).toEqual(false)
    checkIsOverdue({ submitted: '2020-02-29 23:59:59', now: '2020-03-03 23:59:59' }).toEqual(true)

    checkIsOverdue({ submitted: '2020-03-01 00:00:00', now: '2020-03-03 23:59:59' }).toEqual(false)
    checkIsOverdue({ submitted: '2020-03-01 00:00:00', now: '2020-03-04 00:00:00' }).toEqual(true)
  })

  test('check now is around leap year', async () => {
    checkIsOverdue({ submitted: '2020-02-25 23:59:58', now: '2020-02-28 23:59:59' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-25 23:59:59', now: '2020-02-28 23:59:59' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-26 00:00:00', now: '2020-02-28 23:59:59' }).toEqual(false)

    checkIsOverdue({ submitted: '2020-02-25 23:59:59', now: '2020-02-29 00:00:00' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-26 00:00:00', now: '2020-02-29 00:00:00' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-26 00:00:01', now: '2020-02-29 00:00:00' }).toEqual(false)

    checkIsOverdue({ submitted: '2020-02-26 23:59:58', now: '2020-02-29 23:59:59' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-26 23:59:59', now: '2020-02-29 23:59:59' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-27 00:00:00', now: '2020-02-29 23:59:59' }).toEqual(false)

    checkIsOverdue({ submitted: '2020-02-26 23:59:59', now: '2020-03-01 00:00:00' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-27 00:00:00', now: '2020-03-01 00:00:00' }).toEqual(true)
    checkIsOverdue({ submitted: '2020-02-27 00:00:01', now: '2020-03-01 00:00:00' }).toEqual(false)
  })
})

describe('getNextReminderDate', () => {
  const checkGetNextReminderDate = val =>
    expect(moment(getNextReminderDate({ nextReminderDate: moment(val) })).format('YYYY-MM-DD HH:mm:ss'))

  test('normal day', async () => {
    checkGetNextReminderDate('2019-09-06 21:26:17').toEqual('2019-09-07 21:26:17')
  })

  test('end of month', async () => {
    checkGetNextReminderDate('2020-02-28 23:59:59').toEqual('2020-02-29 23:59:59')
    checkGetNextReminderDate('2020-02-29 23:59:59').toEqual('2020-03-01 23:59:59')
  })

  test('leap year', async () => {
    checkGetNextReminderDate('2019-09-30 21:26:17').toEqual('2019-10-01 21:26:17')
  })
})

describe('send', () => {
  const now = moment('2019-09-06 21:26:17')
  const overdue = moment('2019-09-02 21:26:17')
  const notOverdue = moment('2019-09-05 21:26:17')

  describe('reporter', () => {
    test('sendReporterStatementReminder', async () => {
      await send({ isReporter: true, nextReminderDate: now, submittedDate: notOverdue, statementId: -1 }, now)
      expect(notificationService.sendReporterStatementReminder).toBeCalledTimes(1)
      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, moment('2019-09-07 21:26:17').toDate())
    })

    test('sendReporterStatementOverdue', async () => {
      await send({ isReporter: true, nextReminderDate: now, submittedDate: overdue, statementId: -1 }, now)
      expect(notificationService.sendReporterStatementOverdue).toBeCalledTimes(1)
      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, null)
    })
  })

  describe('involved staff', async () => {
    test('sendInvolvedStaffStatementReminder', async () => {
      await send({ isReporter: false, nextReminderDate: now, submittedDate: notOverdue, statementId: -1 }, now)
      expect(notificationService.sendInvolvedStaffStatementReminder).toBeCalledTimes(1)
      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, moment('2019-09-07 21:26:17').toDate())
    })

    test('sendInvolvedStaffStatementOverdue', async () => {
      await send({ isReporter: false, nextReminderDate: now, submittedDate: overdue, statementId: -1 }, now)
      expect(notificationService.sendInvolvedStaffStatementOverdue).toBeCalledTimes(1)
      expect(incidentClient.setNextReminderDate).toBeCalledWith(-1, null)
    })
  })
})
