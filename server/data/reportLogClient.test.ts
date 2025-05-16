import ReportLogClient from './reportLogClient'

let auditClient: ReportLogClient
const query = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
  auditClient = new ReportLogClient()
  query.mockResolvedValue({ rows: [] })
})

describe('create', () => {
  test('it should pass om the correct sql', () => {
    auditClient.create(query, 'user-1', 1)

    expect(query).toBeCalledWith({
      text: `insert into report_log (username, report_id, action, details, timestamp) values ($1, $2, $3, '{}', CURRENT_TIMESTAMP)`,
      values: ['user-1', 1, 'REPORT_CREATED'],
    })
  })
})

describe('insert', () => {
  test('it should pass om the correct sql', () => {
    auditClient.insert(query, 'user-1', 1, 'REPORT_MODIFIED', { some: 'value' })

    expect(query).toBeCalledWith({
      text: `insert into report_log (username, report_id, action, details, timestamp) values ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      values: ['user-1', 1, 'REPORT_MODIFIED', { some: 'value' }],
    })
  })
})
