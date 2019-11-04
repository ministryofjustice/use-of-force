const moment = require('moment')
const serviceCreator = require('./involvedStaffService')
const { ReportStatus } = require('../config/types')

const userService = {
  getUsers: jest.fn(),
}

const db = {
  inTransaction: fn => fn(client),
}

const incidentClient = {
  getCurrentDraftReport: jest.fn(),
  getDraftInvolvedStaff: jest.fn(),
  getInvolvedStaff: jest.fn(),
  deleteInvolvedStaff: jest.fn(),
  updateDraftReport: jest.fn(),
  getReportForReviewer: jest.fn(),
  changeStatus: jest.fn(),
}

const statementsClient = {
  createStatements: jest.fn(),
  isStatementPresentForUser: jest.fn(),
}

const client = jest.fn()

let service

beforeEach(() => {
  service = serviceCreator({ incidentClient, statementsClient, userService, db })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getDraftInvolvedStaff', () => {
  test('it should call query on db', async () => {
    await service.getDraftInvolvedStaff('incident-1')
    expect(incidentClient.getDraftInvolvedStaff).toBeCalledTimes(1)
  })
})

describe('removeMissingDraftInvolvedStaff', () => {
  test('should not blow up with missing data', async () => {
    incidentClient.getCurrentDraftReport.mockReturnValue({ id: 1 })
    await service.removeMissingDraftInvolvedStaff('incident-1')
    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith(1, null, { incidentDetails: { involvedStaff: [] } })
  })

  test('should remove missing staff', async () => {
    incidentClient.getCurrentDraftReport.mockReturnValue({
      id: 1,
      form: {
        evidence: {
          baggedEvidence: true,
        },
        incidentDetails: {
          locationId: -1,
          involvedStaff: [
            { name: 'user1', missing: false },
            { name: 'user2', missing: true },
            { name: 'user3', missing: false },
            { name: 'user4', missing: true },
          ],
        },
      },
    })
    await service.removeMissingDraftInvolvedStaff('incident-1')
    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith(1, null, {
      evidence: {
        baggedEvidence: true,
      },
      incidentDetails: {
        locationId: -1,
        involvedStaff: [{ name: 'user1', missing: false }, { name: 'user3', missing: false }],
      },
    })
  })
})

describe('getInvolvedStaff', () => {
  test('it should call query on db', async () => {
    await service.getInvolvedStaff('incident-1')
    expect(incidentClient.getInvolvedStaff).toBeCalledTimes(1)
  })
})

describe('lookup', () => {
  test('skips lookup if no users provided', async () => {
    const result = await service.lookup('token-1', [])

    expect(result).toEqual([])
    expect(userService.getUsers).not.toBeCalled()
  })

  test('fails when invalid users', async () => {
    userService.getUsers.mockReturnValue({
      exist: [
        {
          i: 0,
          email: 'an@email.com',
          exists: true,
          name: 'Bob Smith',
          username: 'Bob',
          verified: true,
        },
      ],
      missing: [{ i: 1, exists: false, username: 'June', verified: false }],
      notVerified: [{ i: 2, exists: true, username: 'Jenny', verified: false }],
      success: false,
    })

    await expect(service.lookup('token-1', ['Bob', 'June', 'Jenny'])).rejects.toThrow(
      'Contains one or more users with unverified emails'
    )
  })

  test('succeeds when unavailable users', async () => {
    userService.getUsers.mockReturnValue({
      exist: [
        {
          i: 0,
          email: 'an@email.com',
          exists: true,
          name: 'Bob Smith',
          username: 'Bob',
          verified: true,
        },
      ],
      missing: [{ i: 1, exists: false, username: 'June', verified: true }],
      notVerified: [],
      success: true,
    })

    const result = await service.lookup('token-1', ['Bob', 'June', 'Jenny'])

    expect(result).toEqual([
      { email: 'an@email.com', name: 'Bob Smith', staffId: undefined, username: 'Bob' },
      { missing: true, username: 'June' },
    ])
  })

  test('success', async () => {
    userService.getUsers.mockReturnValue({
      exist: [
        {
          staffId: 3,
          i: 2,
          email: 'an@email',
          exists: true,
          name: 'Bob Smith',
          username: 'Bob',
          verified: true,
        },
        { staffId: 1, i: 0, exists: true, email: 'bn@email', username: 'June', name: 'June Smith', verified: true },
        {
          staffId: 2,
          i: 1,
          exists: true,
          email: 'cn@email',
          username: 'Jenny',
          name: 'Jenny Walker',
          verified: true,
        },
      ],
      missing: [],
      notVerified: [],
      success: true,
    })

    const result = await service.lookup('token-1', ['Bob', 'June', 'Jenny'])

    expect(result).toEqual([
      {
        staffId: 1,
        email: 'bn@email',
        username: 'June',
        name: 'June Smith',
      },
      {
        staffId: 2,
        email: 'cn@email',
        username: 'Jenny',
        name: 'Jenny Walker',
      },
      {
        staffId: 3,
        email: 'an@email',
        username: 'Bob',
        name: 'Bob Smith',
      },
    ])
  })
})

describe('save', () => {
  let reportSubmittedDate
  let overdueDate

  let expectedFirstReminderDate

  beforeEach(() => {
    reportSubmittedDate = moment('2019-09-06 21:26:18')
    expectedFirstReminderDate = moment('2019-09-07 21:26:18')
    overdueDate = moment(reportSubmittedDate).add(3, 'days')
  })

  test('when user has already added themselves', async () => {
    statementsClient.createStatements.mockReturnValue({ June: 11, Jenny: 22, Bob: 33 })

    incidentClient.getDraftInvolvedStaff.mockReturnValue([
      {
        staffId: 1,
        email: 'bn@email',
        username: 'June',
        name: 'June Smith',
      },
      {
        staffId: 2,
        email: 'cn@email',
        username: 'Jenny',
        name: 'Jenny Walker',
      },
      {
        staffId: 3,
        email: 'an@email',
        username: 'Bob',
        name: 'Bob Smith',
      },
    ])

    const result = await service.save(
      'form1',
      reportSubmittedDate,
      overdueDate,
      {
        name: 'Bob Smith',
        staffId: 3,
        username: 'Bob',
      },
      client
    )

    expect(result).toEqual([
      { email: 'bn@email', name: 'June Smith', staffId: 1, statementId: 11, userId: 'June' },
      { email: 'cn@email', name: 'Jenny Walker', staffId: 2, statementId: 22, userId: 'Jenny' },
      { email: 'an@email', name: 'Bob Smith', staffId: 3, statementId: 33, userId: 'Bob' },
    ])

    expect(statementsClient.createStatements).toBeCalledWith({
      reportId: 'form1',
      firstReminder: expectedFirstReminderDate.toDate(),
      overdueDate: overdueDate.toDate(),
      staff: [
        { email: 'bn@email', name: 'June Smith', staffId: 1, userId: 'June' },
        {
          email: 'cn@email',
          name: 'Jenny Walker',
          staffId: 2,
          userId: 'Jenny',
        },
        {
          email: 'an@email',
          name: 'Bob Smith',
          staffId: 3,
          userId: 'Bob',
        },
      ],
      client,
    })
  })

  test('when user is not already added', async () => {
    statementsClient.createStatements.mockReturnValue({ June: 11, Jenny: 22, Bob: 33 })

    incidentClient.getDraftInvolvedStaff.mockReturnValue([
      {
        staffId: 1,
        email: 'bn@email',
        username: 'June',
        name: 'June Smith',
      },
      {
        staffId: 2,
        email: 'cn@email',
        username: 'Jenny',
        name: 'Jenny Walker',
      },
    ])

    userService.getUsers.mockReturnValue({
      success: true,
      exist: [
        {
          staffId: 3,
          email: 'an@email',
          username: 'Bob',
          name: 'Bob Smith',
        },
      ],
    })

    const result = await service.save(
      'form1',
      reportSubmittedDate,
      overdueDate,
      {
        name: 'Bob Smith',
        staffId: 3,
        username: 'Bob',
      },
      client
    )

    expect(result).toEqual([
      { email: 'bn@email', name: 'June Smith', staffId: 1, statementId: 11, userId: 'June' },
      { email: 'cn@email', name: 'Jenny Walker', staffId: 2, statementId: 22, userId: 'Jenny' },
      { email: 'an@email', name: 'Bob Smith', staffId: 3, statementId: 33, userId: 'Bob' },
    ])

    expect(statementsClient.createStatements).toBeCalledWith({
      reportId: 'form1',
      firstReminder: expectedFirstReminderDate.toDate(),
      overdueDate: overdueDate.toDate(),
      staff: [
        { email: 'bn@email', name: 'June Smith', staffId: 1, userId: 'June' },
        {
          email: 'cn@email',
          name: 'Jenny Walker',
          staffId: 2,
          userId: 'Jenny',
        },
        {
          email: 'an@email',
          name: 'Bob Smith',
          staffId: 3,
          userId: 'Bob',
        },
      ],
      client,
    })
  })

  describe('addInvolvedStaff', () => {
    const staff = [
      {
        email: 'an@email',
        name: 'Bob Smith',
        staffId: 3,
        userId: 'Bob',
      },
    ]

    beforeEach(() => {
      userService.getUsers.mockReturnValue({
        success: true,
        exist: [
          {
            staffId: 3,
            email: 'an@email',
            username: 'Bob',
            name: 'Bob Smith',
          },
        ],
      })
    })

    test('to complete report', async () => {
      incidentClient.getReportForReviewer.mockReturnValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      })

      await service.addInvolvedStaff('token1', 'form1', 'Bob')

      expect(statementsClient.createStatements).toBeCalledWith({
        reportId: 'form1',
        firstReminder: null,
        overdueDate: overdueDate.toDate(),
        staff,
        client,
      })

      expect(incidentClient.changeStatus).toBeCalledWith('form1', ReportStatus.COMPLETE, ReportStatus.SUBMITTED, client)
    })

    test('to report which is not yet complete', async () => {
      incidentClient.getReportForReviewer.mockReturnValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.SUBMITTED.value,
      })

      await service.addInvolvedStaff('token1', 'form1', 'Bob')

      expect(statementsClient.createStatements).toBeCalledWith({
        reportId: 'form1',
        firstReminder: null,
        overdueDate: overdueDate.toDate(),
        staff,
        client,
      })

      expect(incidentClient.changeStatus).not.toBeCalled()
    })

    test('to non existent report', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).rejects.toThrow("Report: 'form1' does not exist")

      expect(statementsClient.createStatements).not.toBeCalled()
      expect(incidentClient.changeStatus).not.toBeCalled()
    })

    test('when user already has a statement', async () => {
      incidentClient.getReportForReviewer.mockReturnValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      })

      statementsClient.isStatementPresentForUser.mockReturnValue(true)

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).rejects.toThrow(
        "Staff member already exists: 'Bob' on report: 'form1'"
      )

      expect(statementsClient.createStatements).not.toBeCalled()
      expect(incidentClient.changeStatus).not.toBeCalled()
    })
  })

  test('fail to find current user', async () => {
    incidentClient.getDraftInvolvedStaff.mockReturnValue([
      {
        staffId: 1,
        email: 'bn@email',
        username: 'June',
        name: 'June Smith',
      },
      {
        staffId: 2,
        email: 'cn@email',
        username: 'Jenny',
        name: 'Jenny Walker',
      },
    ])

    userService.getUsers.mockReturnValue({
      success: false,
      exist: [],
      missing: [{}],
    })

    await expect(
      service.save('form1', reportSubmittedDate, overdueDate, { name: 'Bob Smith', staffId: 3, username: 'Bob' })
    ).rejects.toThrow(`Could not retrieve user details for 'Bob', missing: 'true', not verified: 'false'`)
  })
})
