const moment = require('moment')
const { createInvolvedStaffService, AddStaffResult } = require('./involvedStaffService')
const { ReportStatus } = require('../config/types')

const userService = {
  getUser: jest.fn(),
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
  deleteStatement: jest.fn(),
  getNumberOfPendingStatements: jest.fn(),
}

const client = jest.fn()

let service

beforeEach(() => {
  service = createInvolvedStaffService({ incidentClient, statementsClient, userService, db })
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
  test('success', async () => {
    const results = [
      {
        staffId: 3,
        email: 'an@email',
        missing: true,
        name: 'Bob Smith',
        username: 'Bob',
        verified: true,
      },
      { staffId: 1, missing: true, email: 'bn@email', username: 'June', name: 'June Smith', verified: true },
      {
        staffId: 2,
        missing: true,
        email: 'cn@email',
        username: 'Jenny',
        name: 'Jenny Walker',
        verified: true,
      },
    ]

    userService.getUsers.mockReturnValue(results)

    const result = await service.lookup('token-1', ['Bob', 'June', 'Jenny'])

    expect(result).toEqual(results)
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

    userService.getUsers.mockReturnValue([
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
      userService.getUsers.mockReturnValue([
        {
          email: 'an@email',
          name: 'Bob Smith',
          staffId: 3,
          username: 'Bob',
          verified: true,
        },
      ])
    })

    test('to complete report', async () => {
      incidentClient.getReportForReviewer.mockReturnValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      })

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.SUCCESS)

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

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.SUCCESS)

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

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.ALREADY_EXISTS)

      expect(statementsClient.createStatements).not.toBeCalled()
      expect(incidentClient.changeStatus).not.toBeCalled()
    })

    test('when user is unverified', async () => {
      incidentClient.getReportForReviewer.mockReturnValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.IN_PROGRESS.value,
      })

      userService.getUsers.mockReturnValue([
        {
          staffId: 3,
          email: 'an@email',
          username: 'Bob',
          name: 'Bob Smith',
          verified: false,
        },
      ])

      statementsClient.isStatementPresentForUser.mockReturnValue(false)

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.SUCCESS_UNVERIFIED)

      expect(statementsClient.createStatements).toBeCalledWith({
        reportId: 'form1',
        firstReminder: null,
        overdueDate: overdueDate.toDate(),
        staff,
        client,
      })
      expect(incidentClient.changeStatus).not.toBeCalled()
    })
  })

  describe('removeInvolvedStaff', () => {
    test('to already complete report', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(0).mockResolvedValueOnce(0)

      await service.removeInvolvedStaff(1, 2)

      expect(statementsClient.deleteStatement).toBeCalledWith({
        statementId: 2,
        client,
      })

      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })

    test('completing report', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(1).mockResolvedValueOnce(0)

      await service.removeInvolvedStaff(1, 2)

      expect(statementsClient.deleteStatement).toBeCalledWith({
        statementId: 2,
        client,
      })

      expect(incidentClient.changeStatus).toHaveBeenCalledWith(1, ReportStatus.SUBMITTED, ReportStatus.COMPLETE, client)
    })

    test('with outstanding statements still remaining', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(2).mockResolvedValueOnce(1)

      await service.removeInvolvedStaff(1, 2)

      expect(statementsClient.deleteStatement).toBeCalledWith({
        statementId: 2,
        client,
      })

      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
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

    userService.getUsers.mockReturnValue([{ missing: true }])

    await expect(
      service.save('form1', reportSubmittedDate, overdueDate, { name: 'Bob Smith', staffId: 3, username: 'Bob' })
    ).rejects.toThrow(`Could not retrieve user details for current user: 'Bob'`)
  })
})
