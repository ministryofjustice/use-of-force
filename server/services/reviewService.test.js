const serviceCreator = require('./reviewService')

const statementsClient = {
  getStatementsForReviewer: jest.fn(),
  getStatementForReviewer: jest.fn(),
  getAdditionalComments: jest.fn(),
}

const incidentClient = {
  getReportForReviewer: jest.fn(),
  getIncompleteReportsForReviewer: jest.fn(),
  getCompletedReportsForReviewer: jest.fn(),
}

let service

describe('reviewService', () => {
  beforeEach(() => {
    service = serviceCreator({ statementsClient, incidentClient })
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

  describe('getStatement', () => {
    test('success', async () => {
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

    test('failed as no statement', async () => {
      statementsClient.getStatementForReviewer.mockReturnValue(null)

      await expect(service.getStatement('statement-1')).rejects.toThrow("Statement: 'statement-1' does not exist")
    })
  })

  describe('getReport', () => {
    test('it should call query on db', async () => {
      incidentClient.getReportForReviewer.mockReturnValue({ id: 2 })
      await service.getReport('report1')
      expect(incidentClient.getReportForReviewer).toBeCalledTimes(1)
      expect(incidentClient.getReportForReviewer).toBeCalledWith('report1')
    })

    test('report not present', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.getReport('report1')).rejects.toThrow("Report: 'report1' does not exist")
    })
  })

  describe('getReports', () => {
    test('it should call query on db', async () => {
      incidentClient.getIncompleteReportsForReviewer.mockReturnValue({ rows: [{ id: 1 }] })
      incidentClient.getCompletedReportsForReviewer.mockReturnValue({ rows: [{ id: 2 }] })

      const result = await service.getReports('agency-1')
      expect(result).toEqual({ awaiting: [{ id: 1 }], completed: [{ id: 2 }] })

      expect(incidentClient.getIncompleteReportsForReviewer).toBeCalledWith('agency-1')
      expect(incidentClient.getIncompleteReportsForReviewer).toBeCalledWith('agency-1')
    })
  })
})
