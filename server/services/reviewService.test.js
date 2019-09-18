const serviceCreator = require('./reviewService')

const statementsClient = {
  getStatementsForReviewer: jest.fn(),
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

    const statements = await service.getStatements('user-1', 1)
    expect(statements).toEqual([{ id: 1 }, { id: 2 }])
  })
})
