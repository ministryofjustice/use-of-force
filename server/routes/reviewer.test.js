const request = require('supertest')
const { appWithAllRoutes, user, reviewerUser } = require('./testutils/appSetup')
const { parseDate } = require('../utils/utils')

const userSupplier = jest.fn()

const offenderService = {
  getOffenderNames: () => [],
  getOffenderDetails: () => ({ displayName: 'Jimmy Choo', offenderNo: '123456' }),
}

const reviewService = {
  getStatements: jest.fn(),
  getReports: jest.fn(),
  getReport: jest.fn(),
}

const reportDetailBuilder = {
  build: jest.fn().mockResolvedValue({ id: 1, form: { incidentDetails: {} } }),
}

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  reviewService.getReport.mockResolvedValue({})
  reviewService.getReports.mockResolvedValue({ awaiting: [], completed: [] })
  app = appWithAllRoutes({ offenderService, reviewService, reportDetailBuilder }, userSupplier)
})

afterEach(() => {
  jest.resetAllMocks()
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

  it('should pass search query params through', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/all-incidents?prisonNumber=A1234AA&reporter=Bob&dateFrom=9 Jan 2020&dateTo=15 Jan 2020')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
        expect(reviewService.getReports).toHaveBeenCalledWith('LEI', {
          dateFrom: parseDate('9 Jan 2020', 'D MMM YYYY'),
          dateTo: parseDate('15 Jan 2020', 'D MMM YYYY'),
          prisonNumber: 'A1234AA',
          reporter: 'Bob',
        })
      })
  })

  it('should pass handle invalid dates', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/all-incidents?prisonNumber=A1234AA&reporter=Bob&dateFrom=&dateTo=blarh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
        expect(reviewService.getReports).toHaveBeenCalledWith('LEI', {
          prisonNumber: 'A1234AA',
          reporter: 'Bob',
        })
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
