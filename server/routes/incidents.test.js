const request = require('supertest')
const { appSetup } = require('./testutils/appSetup')
const createRouter = require('./index')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const statementService = {
  getStatements: () => [{ id: 1, booking_id: 2, created_date: '12/12/2018', user_id: 'ITAG_USER' }],
  getStatement: () => ({
    id: 1,
    booking_id: 2,
    created_date: '12/12/2018',
    user_id: 'ITAG_USER',
    statement: 'Some initial statement',
  }),
  submitStatement: jest.fn(),
  save: jest.fn(),
  validateSavedStatement: jest.fn(),
  saveAdditionalComment: jest.fn(),
}

const reportService = {
  getReports: () => [],
}

const offenderService = {
  getOffenderNames: () => [],
  getOffenderDetails: () => ({ displayName: 'Jimmy Choo', offenderNo: '123456' }),
}
const route = createRouter({ authenticationMiddleware, reportService, statementService, offenderService })

let app

beforeEach(() => {
  statementService.validateSavedStatement.mockReturnValue([])
  app = appSetup(route)
})

describe('GET /incidents', () => {
  it('should render page', () =>
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/my-statements'))
})

describe('GET /my-reports', () => {
  it('should render page', () =>
    request(app)
      .get('/my-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      }))
})
