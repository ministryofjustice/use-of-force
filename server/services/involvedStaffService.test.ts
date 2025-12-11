import moment from 'moment'
import { InvolvedStaffService, AddStaffResult } from './involvedStaffService'
import { ReportStatus } from '../config/types'
import IncidentClient from '../data/incidentClient'
import StatementsClient from '../data/statementsClient'
import UserService from './userService'
import { Report } from '../data/incidentClientTypes'
import ManageUsersApiClient from '../data/manageUsersApiClient'

jest.mock('../data/incidentClient')
jest.mock('../data/statementsClient')
jest.mock('./userService')

const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>
const statementsClient = new StatementsClient(null) as jest.Mocked<StatementsClient>
const userService = new UserService(null, null) as jest.Mocked<UserService>
const manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>

const client = jest.fn()

const db = {
  inTransaction: fn => fn(client),
}

const notificationService = {
  sendInvolvedStaffRemovedFromReport: jest.fn(),
}

let service: InvolvedStaffService

beforeEach(() => {
  service = new InvolvedStaffService(
    incidentClient,
    statementsClient,
    userService,
    db.inTransaction,
    notificationService,
    manageUsersApiClient
  )

  incidentClient.getInvolvedStaff = jest.fn()

  statementsClient.getInvolvedStaffToRemove.mockResolvedValue({
    id: 1,
    userId: 'some_user',
    name: 'Some User',
    email: 'some.user@email.com',
    incidentDate: new Date('2021-04-01 10:00:00'),
    submittedDate: new Date('2021-05-01 10:00:00'),
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getInvolvedStaff', () => {
  test('it should call query on db', async () => {
    await service.getInvolvedStaff(1)
    expect(incidentClient.getInvolvedStaff).toHaveBeenCalledTimes(1)
  })
})

describe('getInvolvedStaffRemovalRequest', () => {
  test('it should call query on db and return removal requested reason', async () => {
    statementsClient.getRemovalRequest.mockResolvedValue({
      isRemovalRequested: true,
      removalRequestedReason: 'Some reason',
    })

    await expect(service.getInvolvedStaffRemovalRequest(1)).resolves.toStrictEqual({
      isRemovalRequested: true,
      removalRequestedReason: 'Some reason',
    })

    expect(statementsClient.getRemovalRequest).toHaveBeenCalledWith(1)
  })
})

describe('update', () => {
  const reportSubmittedDate = moment('2019-09-06 21:26:18').toDate()
  const overdueDate = moment(reportSubmittedDate).add(3, 'days').toDate()

  describe('addInvolvedStaff', () => {
    const staff = {
      email: 'an@email',
      name: 'Bob Smith',
      staffId: 3,
      username: 'BOB',
      exists: true,
      verified: true,
      activeCaseLoadId: 'MDI',
    }

    beforeEach(() => {
      userService.getUser.mockResolvedValue(staff)
    })

    test('to complete report', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      } as Report)

      await expect(service.addInvolvedStaff('token1', 1, 'Bob')).resolves.toBe(AddStaffResult.SUCCESS)

      expect(statementsClient.createStatements).toHaveBeenCalledWith(1, null, overdueDate, [staff], client)

      expect(incidentClient.changeStatus).toHaveBeenCalledWith(
        1,
        'SYSTEM',
        ReportStatus.COMPLETE,
        ReportStatus.SUBMITTED,
        client
      )
    })

    test('to report which is not yet complete', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.SUBMITTED.value,
      } as Report)

      await expect(service.addInvolvedStaff('token1', 1, 'Bob')).resolves.toBe(AddStaffResult.SUCCESS)

      expect(statementsClient.createStatements).toHaveBeenCalledWith(1, null, overdueDate, [staff], client)

      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })

    test('to non existent report', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.addInvolvedStaff('token1', 1, 'Bob')).rejects.toThrow("Report: '1' does not exist")

      expect(statementsClient.createStatements).not.toHaveBeenCalled()
      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })

    test('passes correctly formatted arguments to statements client', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({} as Report)

      await service.addInvolvedStaff('token1', 1, 'Bob')
      expect(statementsClient.isStatementPresentForUser).toHaveBeenCalledWith(1, 'BOB')
    })
    test('when user already has a statement', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      } as Report)

      statementsClient.isStatementPresentForUser.mockResolvedValue(true)

      const result = await service.addInvolvedStaff('token1', 1, 'Bob')
      expect(result).toBe(AddStaffResult.ALREADY_EXISTS)

      expect(statementsClient.createStatements).not.toHaveBeenCalled()
      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
      expect(result).toBe('already-exists')
    })

    test('when user is unverified', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.IN_PROGRESS.value,
      } as Report)

      const unverifiedStaff = {
        exists: true,
        staffId: 3,
        email: 'an@email',
        username: 'Bob',
        name: 'Bob Smith',
        verified: false,
        activeCaseLoadId: 'MDI',
      }

      userService.getUser.mockResolvedValue(unverifiedStaff)

      statementsClient.isStatementPresentForUser.mockResolvedValue(false)

      await expect(service.addInvolvedStaff('token1', 1, 'Bob')).resolves.toBe(AddStaffResult.SUCCESS_UNVERIFIED)

      expect(statementsClient.createStatements).toHaveBeenCalledWith(1, null, overdueDate, [unverifiedStaff], client)
      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })
  })

  // describe('removeInvolvedStaff', () => {
  //   test('removes statement, inserts report edit, marks report COMPLETE', async () => {
  //     // Arrange
  //     const pageInput = { reason: 'someReason', reasonText: 'shouldNotBeUsed', reasonAdditionalInfo: 'extra' }

  //     // incidentClient returns current involved staff (oldValue)
  //     incidentClient.getInvolvedStaff.mockResolvedValue([
  //       {
  //         name: 'Some User',
  //         userId: 'some_user',
  //         email: 'some.user@email.com',
  //         statementId: 0,
  //       },
  //       {
  //         name: 'Other Person',
  //         userId: 'other',
  //         email: 'other@email.com',
  //         statementId: 0,
  //       },
  //     ])

  //     // pending statements: before deletion 1, after deletion 0
  //     statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(1).mockResolvedValueOnce(0)

  //     statementsClient.deleteStatement = jest.fn().mockResolvedValue(undefined)
  //     incidentClient.insertReportEdit = jest.fn().mockResolvedValue(undefined)
  //     incidentClient.changeStatus = jest.fn().mockResolvedValue(undefined)
  //     notificationService.sendInvolvedStaffRemovedFromReport = jest.fn().mockResolvedValue(undefined)

  //     await service.removeInvolvedStaff('removerUser', 1, 1, 'Remover Display', pageInput)

  //     // Assert deletion called
  //     expect(statementsClient.deleteStatement).toHaveBeenCalledWith({ statementId: 1, query: client })

  //     // Assert insertReportEdit called with expected edits
  //     const expectedOld = 'Some User (some_user), Other Person (other)'
  //     const expectedNew = 'Other Person (other)'
  //     expect(incidentClient.insertReportEdit).toHaveBeenCalledTimes(1)
  //     expect(incidentClient.insertReportEdit).toHaveBeenCalledWith(
  //       {
  //         username: 'removerUser',
  //         displayName: 'Remover Display',
  //         reportId: 1,
  //         changes: {
  //           involvedStaff: {
  //             oldValue: expectedOld,
  //             newValue: expectedNew,
  //             question: 'Staff involved',
  //           },
  //         },
  //         reason: pageInput.reason,
  //         reasonText: '', // not 'anotherReasonForEdit' so blank
  //         reasonAdditionalInfo: pageInput.reasonAdditionalInfo,
  //         reportOwnerChanged: false,
  //       },
  //       client
  //     )

  //     // Assert status change called (SUBMITTED -> COMPLETE)
  //     expect(incidentClient.changeStatus).toHaveBeenCalledWith(
  //       1,
  //       'SYSTEM',
  //       ReportStatus.SUBMITTED,
  //       ReportStatus.COMPLETE,
  //       client
  //     )

  //     // Assert notification called with first removed staff
  //     expect(notificationService.sendInvolvedStaffRemovedFromReport).toHaveBeenCalledTimes(1)
  //     expect(notificationService.sendInvolvedStaffRemovedFromReport).toHaveBeenCalledWith(
  //       'some.user@email.com',
  //       {
  //         involvedName: 'Some User',
  //         incidentDate: expect.any(Date),
  //         submittedDate: expect.any(Date),
  //       },
  //       { reportId: 1, statementId: 1 }
  //     )
  //   })

  //   test('removes statement and does not change status when pending before deletion is 0', async () => {
  //     // Arrange
  //     const pageInput = { reason: 'anotherReason', reasonText: 'text', reasonAdditionalInfo: 'ai' }

  //     incidentClient.getInvolvedStaff.mockResolvedValue([
  //       {
  //         name: 'Some User',
  //         userId: 'some_user',
  //         email: 'some.user@email.com',
  //         statementId: 0,
  //       },
  //     ])

  //     // pending statements: before deletion 0 (so no further checks)
  //     statementsClient.getNumberOfPendingStatements.mockResolvedValue(0)

  //     statementsClient.deleteStatement = jest.fn().mockResolvedValue(undefined)
  //     incidentClient.insertReportEdit = jest.fn().mockResolvedValue(undefined)
  //     incidentClient.changeStatus = jest.fn().mockResolvedValue(undefined)
  //     notificationService.sendInvolvedStaffRemovedFromReport = jest.fn().mockResolvedValue(undefined)

  //     await service.removeInvolvedStaff('removerUser', 1, 1, 'Remover Display', pageInput)

  //     // Assert delete and insert called
  //     expect(statementsClient.deleteStatement).toHaveBeenCalledWith({ statementId: 1, query: client })
  //     expect(incidentClient.insertReportEdit).toHaveBeenCalledTimes(1)

  //     // Assert changeStatus not called
  //     expect(incidentClient.changeStatus).not.toHaveBeenCalled()

  //     // Notification still sent
  //     expect(notificationService.sendInvolvedStaffRemovedFromReport).toHaveBeenCalledTimes(1)
  //   })

  //   test('handles getInvolvedStaffToRemove returning an array and sends notification for first element', async () => {
  //     const pageInput = { reason: 'r', reasonText: '', reasonAdditionalInfo: '' }

  //     const removalArray = [
  //       {
  //         id: 10,
  //         userId: 'first_user',
  //         name: 'First User',
  //         email: 'first.user@email.com',
  //         incidentDate: new Date('2022-01-01T10:00:00Z'),
  //         submittedDate: new Date('2022-01-02T10:00:00Z'),
  //       },
  //       {
  //         id: 11,
  //         userId: 'second_user',
  //         name: 'Second User',
  //         email: 'second.user@email.com',
  //         incidentDate: new Date('2022-01-03T10:00:00Z'),
  //         submittedDate: new Date('2022-01-04T10:00:00Z'),
  //       },
  //     ]

  //     // override to return array
  //     statementsClient.getInvolvedStaffToRemove.mockResolvedValue(removalArray as any)

  //     // make old involved staff include both
  //     incidentClient.getInvolvedStaff.mockResolvedValue([
  //       {
  //         name: 'First User',
  //         userId: 'first_user',
  //         email: 'first.user@email.com',
  //         statementId: 0,
  //       },
  //       {
  //         name: 'Second User',
  //         userId: 'second_user',
  //         email: 'second.user@email.com',
  //         statementId: 0,
  //       },
  //     ])

  //     statementsClient.getNumberOfPendingStatements.mockResolvedValue(0)
  //     statementsClient.deleteStatement = jest.fn().mockResolvedValue(undefined)
  //     incidentClient.insertReportEdit = jest.fn().mockResolvedValue(undefined)
  //     notificationService.sendInvolvedStaffRemovedFromReport = jest.fn().mockResolvedValue(undefined)

  //     await service.removeInvolvedStaff('u', 1, 1, 'd', pageInput)

  //     // Assert notification used first element
  //     expect(notificationService.sendInvolvedStaffRemovedFromReport).toHaveBeenCalledWith(
  //       removalArray[0].email,
  //       {
  //         involvedName: removalArray[0].name,
  //         incidentDate: expect.any(Date),
  //         submittedDate: removalArray[0].submittedDate,
  //       },
  //       { reportId: 1, statementId: 1 }
  //     )
  //   })
  // })

  describe('updateReportEditWithInvolvedStaff', () => {
    test('calls incidentClient.insertReportEdit with provided edits and query', async () => {
      incidentClient.insertReportEdit = jest.fn().mockResolvedValue(undefined)

      const edits = { username: 'u', reportId: 1, changes: {} }
      const query = { client: 'db' }

      await service.updateReportEditWithInvolvedStaff(edits, query)

      expect(incidentClient.insertReportEdit).toHaveBeenCalledTimes(1)
      expect(incidentClient.insertReportEdit).toHaveBeenCalledWith(edits, query)
    })

    test('propagates errors from incidentClient.insertReportEdit', async () => {
      const err = new Error('insert failed')
      incidentClient.insertReportEdit = jest.fn().mockRejectedValue(err)

      await expect(service.updateReportEditWithInvolvedStaff({}, {})).rejects.toThrow('insert failed')
    })
  })

  describe('findInvolvedStaffFuzzySearch', () => {
    test('calls userService.findUsersFuzzySearch with provided args and returns result', async () => {
      const token = 'token-123'
      const reportId = 42
      const value = 'Smith'
      const page = 2
      const expected = { results: [{ username: 'SMITH', name: 'John Smith' }], total: 1 }

      userService.findUsersFuzzySearch = jest.fn().mockResolvedValue(expected)

      await expect(service.findInvolvedStaffFuzzySearch(token, reportId, value, page)).resolves.toBe(expected)
      expect(userService.findUsersFuzzySearch).toHaveBeenCalledTimes(1)
      expect(userService.findUsersFuzzySearch).toHaveBeenCalledWith(token, value, page)
    })

    test('propagates errors from userService.findUsersFuzzySearch', async () => {
      const err = new Error('fuzzy failed')
      userService.findUsersFuzzySearch = jest.fn().mockRejectedValue(err)

      await expect(service.findInvolvedStaffFuzzySearch('t', 1, 'x', 1)).rejects.toThrow('fuzzy failed')
    })
  })
})
