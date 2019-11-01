const serviceCreator = require('./statementService')
const { StatementStatus, ReportStatus } = require('../config/types')

const incidentClient = {
  changeStatus: jest.fn(),
}

const statementsClient = {
  getStatements: jest.fn(),
  getStatementForUser: jest.fn(),
  saveStatement: jest.fn(),
  submitStatement: jest.fn(),
  getAdditionalComments: jest.fn(),
  saveAdditionalComment: jest.fn(),
  getNumberOfPendingStatements: jest.fn(),
}

const client = 'client-1'
const db = {
  inTransaction: fn => fn(client),
}

let service

describe('statmentService', () => {
  beforeEach(() => {
    service = serviceCreator({ statementsClient, incidentClient, db })
    statementsClient.getStatements.mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] })
    statementsClient.saveAdditionalComment(50, 'Some new comment')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('saveAdditionalComment', () => {
    test('save a new comment', async () => {
      await service.saveAdditionalComment(50, 'Some new comment')
      expect(statementsClient.saveAdditionalComment).toBeCalledWith(50, 'Some new comment')
    })
  })

  describe('getStatements', () => {
    test('retrieve  details', async () => {
      const output = await service.getStatements('user1', StatementStatus.PENDING)

      expect(output).toEqual([{ id: 1 }, { id: 2 }])

      expect(statementsClient.getStatements).toBeCalledTimes(1)
      expect(statementsClient.getStatements).toBeCalledWith('user1', StatementStatus.PENDING)
    })
  })

  describe('getStatementForUser', () => {
    test('retrieve details when user is involved', async () => {
      const statement = { id: 1, user_id: 'BOB' }
      const comment = 'Some additional text'
      statementsClient.getStatementForUser.mockReturnValue(statement)
      statementsClient.getAdditionalComments.mockReturnValue([
        {
          id: 1,
          statement_id: 1,
          additional_comment: comment,
          data_submitted: '2019-03-05 01:03:28',
        },
      ])

      const output = await service.getStatementForUser('BOB', 1, StatementStatus.PENDING)

      expect(output).toEqual({
        ...statement,
        additionalComments: [
          {
            id: 1,
            statement_id: 1,
            additional_comment: comment,
            data_submitted: '2019-03-05 01:03:28',
          },
        ],
      })

      expect(statementsClient.getStatementForUser).toBeCalledWith('BOB', 1, StatementStatus.PENDING)
    })

    test('retrieve details when statement is not present', async () => {
      statementsClient.getStatementForUser.mockReturnValue(undefined)

      await expect(service.getStatementForUser('BOB', 1, 'PENDING')).rejects.toThrow(
        new Error("Report: '1' does not exist")
      )

      expect(statementsClient.getStatementForUser).toBeCalledWith('BOB', 1, 'PENDING')
    })
  })

  test('should call save', async () => {
    const statement = {}

    await service.save('user1', 'incident-1', statement)

    expect(statementsClient.saveStatement).toBeCalledTimes(1)
    expect(statementsClient.saveStatement).toBeCalledWith('user1', 'incident-1', statement)
  })

  describe('submitStatement', () => {
    test('does not mark report as complete if still pending statements', async () => {
      statementsClient.getNumberOfPendingStatements.mockReturnValue(1)
      await service.submitStatement('user1', 'incident-1')

      expect(statementsClient.submitStatement).toBeCalledTimes(1)
      expect(statementsClient.submitStatement).toBeCalledWith('user1', 'incident-1', client)
      expect(incidentClient.changeStatus).not.toHaveBeenCalled()
    })

    test('marks report as complete if no pending statements', async () => {
      statementsClient.getNumberOfPendingStatements.mockReturnValue(0)

      await service.submitStatement('user1', 'incident-1')

      expect(statementsClient.submitStatement).toBeCalledTimes(1)
      expect(statementsClient.submitStatement).toBeCalledWith('user1', 'incident-1', client)

      expect(incidentClient.changeStatus).toHaveBeenCalledWith(
        'incident-1',
        ReportStatus.SUBMITTED,
        ReportStatus.COMPLETE,
        client
      )
    })
  })

  describe('validateSavedStatement', () => {
    test('valid statement', async () => {
      statementsClient.getStatementForUser.mockReturnValue({
        lastTrainingMonth: 1,
        lastTrainingYear: 2000,
        jobStartYear: 1998,
        statement: 'A statement',
      })

      const errors = await service.validateSavedStatement('user-1', 1)
      expect(errors).toEqual([])
    })

    test('can cope with additional attributes', async () => {
      statementsClient.getStatementForUser.mockReturnValue({
        lastTrainingMonth: 1,
        lastTrainingYear: 2000,
        jobStartYear: 1998,
        statement: 'A statement',
        id: 1223,
        bookingId: 'bookingId',
      })

      const errors = await service.validateSavedStatement('user-1', 1)
      expect(errors).toEqual([])
    })

    test('invalid statement', async () => {
      statementsClient.getStatementForUser.mockReturnValue({})

      const errors = await service.validateSavedStatement('user-1', 1)
      expect(errors.map(error => error.href)).toEqual(
        expect.arrayContaining(['#lastTrainingYear', '#jobStartYear', '#statement'])
      )
    })
  })
})
