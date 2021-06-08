import moment from 'moment'
import { InvolvedStaffService, AddStaffResult } from './involvedStaffService'
import { ReportStatus } from '../config/types'
import IncidentClient from '../data/incidentClient'
import StatementsClient from '../data/statementsClient'
import UserService from './userService'
import { Report } from '../data/incidentClientTypes'

jest.mock('../data/incidentClient')
jest.mock('../data/statementsClient')
jest.mock('./userService')

const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>
const statementsClient = new StatementsClient(null) as jest.Mocked<StatementsClient>
const userService = new UserService(null, null) as jest.Mocked<UserService>

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
    notificationService
  )

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
    expect(incidentClient.getInvolvedStaff).toBeCalledTimes(1)
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

    expect(statementsClient.getRemovalRequest).toBeCalledWith(1)
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
      username: 'Bob',
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

      expect(statementsClient.createStatements).toBeCalledWith(1, null, overdueDate, [staff], client)

      expect(incidentClient.changeStatus).toBeCalledWith(
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

      expect(statementsClient.createStatements).toBeCalledWith(1, null, overdueDate, [staff], client)

      expect(incidentClient.changeStatus).not.toBeCalled()
    })

    test('to non existent report', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.addInvolvedStaff('token1', 1, 'Bob')).rejects.toThrow("Report: '1' does not exist")

      expect(statementsClient.createStatements).not.toBeCalled()
      expect(incidentClient.changeStatus).not.toBeCalled()
    })

    test('when user already has a statement', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({
        submittedDate: reportSubmittedDate,
        status: ReportStatus.COMPLETE.value,
      } as Report)

      statementsClient.isStatementPresentForUser.mockResolvedValue(true)

      await expect(service.addInvolvedStaff('token1', 1, 'Bob')).resolves.toBe(AddStaffResult.ALREADY_EXISTS)

      expect(statementsClient.createStatements).not.toBeCalled()
      expect(incidentClient.changeStatus).not.toBeCalled()
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

      expect(statementsClient.createStatements).toBeCalledWith(1, null, overdueDate, [unverifiedStaff], client)
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

      expect(statementsClient.getInvolvedStaffToRemove).toBeCalledWith(2)
      expect(notificationService.sendInvolvedStaffRemovedFromReport).toBeCalledWith(
        'some.user@email.com',
        {
          incidentDate: moment('2021-04-01 10:00:00').toDate(),
          involvedName: 'Some User',
          submittedDate: moment('2021-05-01 10:00:00').toDate(),
        },
        { reportId: 1, statementId: 2 }
      )

      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })

    test('completing report', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(1).mockResolvedValueOnce(0)

      await service.removeInvolvedStaff(1, 2)

      expect(statementsClient.deleteStatement).toBeCalledWith({
        statementId: 2,
        query: client,
      })

      expect(statementsClient.getInvolvedStaffToRemove).toBeCalledWith(2)
      expect(notificationService.sendInvolvedStaffRemovedFromReport).toBeCalledWith(
        'some.user@email.com',
        {
          incidentDate: moment('2021-04-01 10:00:00').toDate(),
          involvedName: 'Some User',
          submittedDate: moment('2021-05-01 10:00:00').toDate(),
        },
        { reportId: 1, statementId: 2 }
      )

      expect(incidentClient.changeStatus).toHaveBeenCalledWith(
        1,
        'SYSTEM',
        ReportStatus.SUBMITTED,
        ReportStatus.COMPLETE,
        client
      )
    })

    test('with outstanding statements still remaining', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValueOnce(2).mockResolvedValueOnce(1)

      await service.removeInvolvedStaff(1, 2)

      expect(statementsClient.deleteStatement).toBeCalledWith({
        statementId: 2,
        query: client,
      })
      expect(statementsClient.getInvolvedStaffToRemove).toBeCalledWith(2)
      expect(notificationService.sendInvolvedStaffRemovedFromReport).toBeCalledWith(
        'some.user@email.com',
        {
          incidentDate: moment('2021-04-01 10:00:00').toDate(),
          involvedName: 'Some User',
          submittedDate: moment('2021-05-01 10:00:00').toDate(),
        },
        { reportId: 1, statementId: 2 }
      )
      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })
  })
})
