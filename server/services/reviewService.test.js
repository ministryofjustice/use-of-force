const serviceCreator = require('./reviewService')

const statementsClient = {
  getStatementsForReviewer: jest.fn(),
  getStatementForReviewer: jest.fn(),
  getAdditionalComments: jest.fn(),
}

let service

describe('reviewService', () => {
  beforeEach(() => {
    service = serviceCreator({ statementsClient })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('getStatements', async () => {
    statementsClient.getStatementsForReviewer.mockReturnValue([{ id: 1 }, { id: 2 }])

    const statements = await service.getStatements('report-1')

    expect(statements).toEqual([{ id: 1 }, { id: 2 }])
    expect(statementsClient.getStatementsForReviewer).toBeCalledWith('report-1')
  })

  test('getStatement', async () => {
    statementsClient.getStatementForReviewer.mockReturnValue({ id: 2 })

    statementsClient.getAdditionalComments.mockReturnValue([
      {
        id: 1,
        statement_id: 1,
        additional_comment: 'comment1',
        data_submitted: '2019-03-05 01:03:28',
      },
    ])

    const output = await service.getStatement('statement-1')

    expect(output).toEqual({
      id: 2,
      additionalComments: [
        {
          id: 1,
          statement_id: 1,
          additional_comment: 'comment1',
          data_submitted: '2019-03-05 01:03:28',
        },
      ],
    })

    expect(statementsClient.getStatementForReviewer).toBeCalledWith('statement-1')
  })
})
