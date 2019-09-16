const request = require('supertest')
const { appSetup, user, reviewerUser } = require('./testutils/appSetup')
const createRouter = require('./index')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const userSupplier = jest.fn()

const reportService = {
  getReports: () => [],
  getReportsForReviewer: () => [],
  getReport: jest.fn(),
}

const offenderService = {
  getOffenderNames: () => [],
  getLocation: () => [],
  getOffenderDetails: () => ({ displayName: 'Jimmy Choo', offenderNo: '123456' }),
}

const involvedStaffService = {
  getInvolvedStaff: () => [],
}

const route = createRouter({ authenticationMiddleware, reportService, involvedStaffService, offenderService })

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  app = appSetup(route, userSupplier)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incidents', () => {
  it('should render page', () =>
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/your-statements'))
})

describe('GET /your-reports', () => {
  it('should render page', () =>
    request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      }))
})

describe('GET /all-incidents', () => {
  it('should render page for reviewer', async () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/all-incidents')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      })
  })

  it('should redirect if not reviewer', async () => {
    userSupplier.mockReturnValue(user)
    return request(app)
      .get('/all-incidents')
      .expect(302)
      .expect('Location', '/your-statements')
  })
})

describe('GET /your-report', () => {
  it('should render page', () => {
    reportService.getReport.mockReturnValue({ id: 1, form: { incidentDetails: {} } })
    return request(app)
      .get('/1/your-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force report')
      })
  })

  it('should fail to render page when no report', () => {
    reportService.getReport.mockReturnValue(undefined)
    return request(app)
      .get('/1/your-report')
      .expect(500)
  })
})
