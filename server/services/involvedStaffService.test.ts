import moment from 'moment'
import { InvolvedStaffService, AddStaffResult } from './involvedStaffService'
import { ReportStatus } from '../config/types'
import IncidentClient from '../data/incidentClient'
import StatementsClient from '../data/statementsClient'
import { User } from '../types/uof'

jest.mock('../data/incidentClient')
jest.mock('../data/statementsClient')

const incidentClient = new IncidentClient(jest.fn as any, jest.fn as any) as jest.Mocked<IncidentClient>
const statementsClient = new StatementsClient(jest.fn as any) as jest.Mocked<StatementsClient>

const userService = {
  getUser: jest.fn(),
  getUsers: jest.fn(),
}

const client = jest.fn()

const db = {
  queryPerformer: jest.fn(),
  inTransaction: fn => fn(client),
}

let service: InvolvedStaffService

beforeEach(() => {
  service = new InvolvedStaffService(incidentClient, statementsClient, userService, db.inTransaction, db.queryPerformer)
})

afterEach(() => {
  jest.resetAllMocks()
})

const user: User = {
  staffId: 3,
  username: 'Jo',
  firstName: 'Jo',
  lastName: 'Smith',
  activeCaseLoadId: 'LEI',
  accountStatus: 'ACTIVE',
  active: true,
  caseLoadId: 'LEI',
  description: 'Leeds',
  type: '',
  caseloadFunction: '',
  currentlyActive: true,
  displayname: 'Jo Smith',
}

describe('getDraftInvolvedStaff', () => {
  test('it should call query on db', async () => {
    await service.getDraftInvolvedStaff(1)
    expect(incidentClient.getDraftInvolvedStaff).toBeCalledTimes(1)
  })
})

describe('removeMissingDraftInvolvedStaff', () => {
  test('should not blow up with missing data', async () => {
    incidentClient.getCurrentDraftReport.mockResolvedValue({ id: 1 })
    await service.removeMissingDraftInvolvedStaff('user-1', 1)
    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith(1, null, { incidentDetails: { involvedStaff: [] } })
  })

  test('should remove missing staff', async () => {
    incidentClient.getCurrentDraftReport.mockResolvedValue({
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
    await service.removeMissingDraftInvolvedStaff('user-1', 1)
    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith(1, null, {
      evidence: {
        baggedEvidence: true,
      },
      incidentDetails: {
        locationId: -1,
        involvedStaff: [
          { name: 'user1', missing: false },
          { name: 'user3', missing: false },
        ],
      },
    })
  })
})

describe('getInvolvedStaff', () => {
  test('it should call query on db', async () => {
    await service.getInvolvedStaff(1)
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
    statementsClient.createStatements.mockResolvedValue({ June: 11, Jenny: 22, Jo: 33 })
    userService.getUsers.mockResolvedValue([])
    incidentClient.getDraftInvolvedStaff.mockResolvedValue([
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
        username: 'Jo',
        name: 'Jo Smith',
      },
    ])

    const result = await service.save(1, reportSubmittedDate, overdueDate, user, client)

    expect(result).toEqual([
      { email: 'bn@email', name: 'June Smith', staffId: 1, statementId: 11, userId: 'June' },
      { email: 'cn@email', name: 'Jenny Walker', staffId: 2, statementId: 22, userId: 'Jenny' },
      { email: 'an@email', name: 'Jo Smith', staffId: 3, statementId: 33, userId: 'Jo' },
    ])

    expect(statementsClient.createStatements).toBeCalledWith({
      reportId: 1,
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
          name: 'Jo Smith',
          staffId: 3,
          userId: 'Jo',
        },
      ],
      query: db.queryPerformer,
    })
  })

  test('when user is not already added', async () => {
    statementsClient.createStatements.mockResolvedValue({ June: 11, Jenny: 22, Bob: 33 })

    incidentClient.getDraftInvolvedStaff.mockResolvedValue([
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

    userService.getUsers.mockResolvedValue([
      {
        staffId: 3,
        email: 'an@email',
        username: 'Bob',
        name: 'Bob Smith',
      },
    ])

    const result = await service.save(1, reportSubmittedDate, overdueDate, user, db.queryPerformer)

    expect(result).toEqual([
      { email: 'bn@email', name: 'June Smith', staffId: 1, statementId: 11, userId: 'June' },
      { email: 'cn@email', name: 'Jenny Walker', staffId: 2, statementId: 22, userId: 'Jenny' },
      { email: 'an@email', name: 'Bob Smith', staffId: 3, statementId: 33, userId: 'Bob' },
    ])

    expect(statementsClient.createStatements).toBeCalledWith({
      reportId: 1,
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
      query: db.queryPerformer,
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
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      })

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.SUCCESS)

      expect(statementsClient.createStatements).toBeCalledWith({
        reportId: 'form1',
        firstReminder: null,
        overdueDate: overdueDate.toDate(),
        staff,
        query: db.queryPerformer,
      })

      expect(incidentClient.changeStatus).toBeCalledWith('form1', ReportStatus.COMPLETE, ReportStatus.SUBMITTED, client)
    })

    test('to report which is not yet complete', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.SUBMITTED.value,
      })

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.SUCCESS)

      expect(statementsClient.createStatements).toBeCalledWith({
        reportId: 'form1',
        firstReminder: null,
        overdueDate: overdueDate.toDate(),
        staff,
        query: db.queryPerformer,
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
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      })

      statementsClient.isStatementPresentForUser.mockResolvedValue(true)

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.ALREADY_EXISTS)

      expect(statementsClient.createStatements).not.toBeCalled()
      expect(incidentClient.changeStatus).not.toBeCalled()
    })

    test('when user is unverified', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
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

      statementsClient.isStatementPresentForUser.mockResolvedValue(false)

      await expect(service.addInvolvedStaff('token1', 'form1', 'Bob')).resolves.toBe(AddStaffResult.SUCCESS_UNVERIFIED)

      expect(statementsClient.createStatements).toBeCalledWith({
        reportId: 'form1',
        firstReminder: null,
        overdueDate: overdueDate.toDate(),
        staff,
        query: db.queryPerformer,
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
        query: client,
      })

      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })

    test('completing report', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(1).mockResolvedValueOnce(0)

      await service.removeInvolvedStaff(1, 2)

      expect(statementsClient.deleteStatement).toBeCalledWith({
        statementId: 2,
        query: client,
      })

      expect(incidentClient.changeStatus).toHaveBeenCalledWith(1, ReportStatus.SUBMITTED, ReportStatus.COMPLETE, client)
    })

    test('with outstanding statements still remaining', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(2).mockResolvedValueOnce(1)

      await service.removeInvolvedStaff(1, 2)

      expect(statementsClient.deleteStatement).toBeCalledWith({
        statementId: 2,
        query: client,
      })

      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })
  })

  test('fail to find current user', async () => {
    incidentClient.getDraftInvolvedStaff.mockResolvedValue([
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

    await expect(service.save(1, reportSubmittedDate, overdueDate, user, db.queryPerformer)).rejects.toThrow(
      `Could not retrieve user details for current user: 'Jo'`
    )
  })
})
