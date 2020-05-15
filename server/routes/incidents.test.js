const request = require('supertest')
const { appWithAllRoutes, user, reviewerUser } = require('./testutils/appSetup')

const userSupplier = jest.fn()

const reportService = {
  getReports: () => [],
  getReport: jest.fn(),
}

const offenderService = {
  getOffenderNames: () => [],
  getLocation: () => [],
  getOffenderDetails: () => ({ displayName: 'Jimmy Choo', offenderNo: '123456' }),
}

const reviewService = {
  getStatements: jest.fn(),
  getReports: () => ({ awaiting: [], completed: [] }),
  getReport: jest.fn(),
}

const locationService = {
  getPrisonById: jest.fn().mockResolvedValue({ agencyId: 'MDI', description: 'HMP Moorland' }),
}

const involvedStaffService = {
  getInvolvedStaff: () => [],
}

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  app = appWithAllRoutes(
    { reportService, involvedStaffService, offenderService, reviewService, locationService },
    userSupplier
  )
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
  it('should render page for reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/all-incidents')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      })
  })

  it('should not allow if not reviewer', () => {
    userSupplier.mockReturnValue(user)
    return request(app)
      .get('/all-incidents')
      .expect(401)
      .expect(res => expect(res.text).toContain('Not authorised to access this resource'))
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

describe('GET /view-report', () => {
  it('should render page for reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockReturnValue({ id: 1, form: { incidentDetails: {} } })
    return request(app)
      .get('/1/view-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force report')
        expect(res.text).not.toContain('Delete report')
      })
  })

  it('should fail to render page when no report', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockReturnValue(undefined)
    return request(app)
      .get('/1/view-report')
      .expect(500)
  })
})

describe('GET /view-statements', () => {
  it('should render page if reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockReturnValue({ id: 1, form: { incidentDetails: {} } })
    reviewService.getStatements.mockReturnValue([])
    return request(app)
      .get('/1/view-statements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incident')
      })
  })

  it('should not allow if not reviewer', () => {
    userSupplier.mockReturnValue(user)
    reviewService.getReport.mockReturnValue({ id: 1, form: { incidentDetails: {} } })
    reviewService.getStatements.mockReturnValue([])
    return request(app)
      .get('/1/view-statements')
      .expect(401)
      .expect(res => expect(res.text).toContain('Not authorised to access this resource'))
  })

  it('should error if report doesnt exist', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockReturnValue(null)
    reviewService.getStatements.mockReturnValue([])
    return request(app)
      .get('/1/view-statements')
      .expect(500)
  })
})
