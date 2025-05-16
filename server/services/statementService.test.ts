import StatementService from './statementService'
import { StatementStatus, ReportStatus } from '../config/types'
import IncidentClient from '../data/incidentClient'
import StatementsClient from '../data/statementsClient'
import { PageResponse } from '../utils/page'
import { Statement, StatementUpdate } from '../data/statementsClientTypes'

jest.mock('../data/incidentClient')
jest.mock('../data/statementsClient')

const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>
const statementsClient = new StatementsClient(jest.fn()) as jest.Mocked<StatementsClient>

const client = 'client-1'
const inTransaction = fn => fn(client)

let service: StatementService

describe('statmentService', () => {
  beforeEach(() => {
    service = new StatementService(statementsClient, incidentClient, inTransaction)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('saveAdditionalComment', () => {
    test('save a new comment', async () => {
      await service.saveAdditionalComment(50, 'A new comment')
      expect(statementsClient.saveAdditionalComment).toBeCalledWith(50, 'A new comment')
    })
  })

  describe('getStatements', () => {
    test('retrieve  details', async () => {
      const statement = {
        id: 1,
        reporterName: 'BOB',
        inProgress: false,
        isOverdue: false,
        isRemovalRequested: false,
        name: 'bob',
        status: StatementStatus.PENDING.value,
        incidentDate: new Date(),
        offenderNo: 'AA1234A',
      }

      const pageResponse = new PageResponse({ min: 0, max: 1, totalCount: 1, totalPages: 1, page: 1 }, [statement])

      statementsClient.getStatements.mockResolvedValue(pageResponse)

      const output = await service.getStatements('user1', 1)

      expect(output).toEqual(pageResponse)
      expect(statementsClient.getStatements).toBeCalledWith('user1', 1)
    })
  })

  describe('getStatementForUser', () => {
    test('retrieve details when user is involved', async () => {
      const date = new Date('2019-03-05 01:03:28')

      const statement = {
        id: 1,
        bookingId: 12,
        incidentDate: date,
        lastTrainingMonth: 1,
        lastTrainingYear: 2009,
        jobStartYear: 2012,
        statement: 'My statement',
        submittedDate: date,
        name: 'bob',
        reporterName: 'BOB',
      }

      const comment = 'Some additional text'
      statementsClient.getStatementForUser.mockResolvedValue(statement)
      statementsClient.getAdditionalComments.mockResolvedValue([
        {
          additionalComment: comment,
          dateSubmitted: date,
        },
      ])

      const output = await service.getStatementForUser('BOB', 1, StatementStatus.PENDING)

      expect(output).toEqual({
        ...statement,
        additionalComments: [
          {
            additionalComment: comment,
            dateSubmitted: date,
          },
        ],
      })

      expect(statementsClient.getStatementForUser).toBeCalledWith('BOB', 1, StatementStatus.PENDING)
    })

    test('retrieve details when statement is not present', async () => {
      statementsClient.getStatementForUser.mockReturnValue(undefined)

      await expect(service.getStatementForUser('BOB', 1, StatementStatus.PENDING)).rejects.toThrow(
        new Error("Report: '1' does not exist")
      )

      expect(statementsClient.getStatementForUser).toBeCalledWith('BOB', 1, StatementStatus.PENDING)
    })
  })

  test('should call save', async () => {
    const statement = {} as StatementUpdate

    await service.save('user1', 1, statement)

    expect(statementsClient.saveStatement).toBeCalledTimes(1)
    expect(statementsClient.saveStatement).toBeCalledWith('user1', 1, statement)
  })

  describe('submitStatement', () => {
    test('does not mark report as complete if still pending statements', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValue(1)
      await service.submitStatement('user1', 1)

      expect(statementsClient.submitStatement).toBeCalledTimes(1)
      expect(statementsClient.submitStatement).toBeCalledWith('user1', 1, client)
      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })

    test('marks report as complete if no pending statements', async () => {
      statementsClient.getNumberOfPendingStatements.mockResolvedValue(0)

      await service.submitStatement('user1', 1)

      expect(statementsClient.submitStatement).toBeCalledTimes(1)
      expect(statementsClient.submitStatement).toBeCalledWith('user1', 1, client)

      expect(incidentClient.changeStatus).toHaveBeenCalledWith(
        1,
        'user1',
        ReportStatus.SUBMITTED,
        ReportStatus.COMPLETE,
        client
      )
    })
  })

  describe('validateSavedStatement', () => {
    test('valid statement', async () => {
      const date = new Date()
      statementsClient.getStatementForUser.mockResolvedValue({
        id: 1223,
        bookingId: 19,
        incidentDate: date,
        lastTrainingMonth: 1,
        lastTrainingYear: 2000,
        jobStartYear: 1998,
        statement: 'A statement',
        submittedDate: date,
        name: 'bob',
        reporterName: 'BOB',
      })

      const errors = await service.validateSavedStatement('user-1', 1)
      expect(errors).toEqual([])
    })

    test('invalid statement', async () => {
      statementsClient.getStatementForUser.mockResolvedValue({} as Statement)

      const errors = await service.validateSavedStatement('user-1', 1)
      expect(errors.map(error => error.href)).toEqual(
        expect.arrayContaining(['#lastTrainingYear', '#jobStartYear', '#statement'])
      )
    })
  })

  describe('requestStatementRemoval', () => {
    test('request statement removal', async () => {
      await service.requestStatementRemoval(1, 'request reason')
      expect(statementsClient.requestStatementRemoval).toBeCalledWith(1, 'request reason')
    })
  })

  describe('refuseRequest', () => {
    test('calls statment client correctly', async () => {
      const date = new Date()
      statementsClient.getStatementForReviewer.mockResolvedValue({
        id: 1,
        bookingId: 19,
        reportId: 1223,
        userId: 'user1',
        isOverdue: false,
        isSubmitted: false,
        isRemovalRequested: true,
        incidentDate: date,
        lastTrainingMonth: 1,
        lastTrainingYear: 2000,
        jobStartYear: 1998,
        statement: 'A statement',
        submittedDate: date,
        name: 'bob',
      })

      await service.refuseRequest(1)
      expect(statementsClient.refuseStatementRemoval).toBeCalledWith(1)
    })
  })
})
