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
  getReport: jest.fn(),
  getIncompleteReports: jest.fn(),
  getCompletedReports: jest.fn(),
}

const reportDetailBuilder = {
  build: jest.fn().mockResolvedValue({ id: 1, form: { incidentDetails: {} } }),
}

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  reviewService.getReport.mockResolvedValue({})
  app = appWithAllRoutes({ offenderService, reviewService, reportDetailBuilder }, userSupplier)
  reviewService.getIncompleteReports.mockResolvedValue({ awaiting: [] })
  reviewService.getCompletedReports.mockResolvedValue([{}])
})

afterEach(() => {
  jest.resetAllMocks()
})

const incidentStatus = ['/completed-incidents', '/not-completed-incidents']

describe(`GET /completed-incidents`, () => {
  it('should render page for reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get(`/completed-incidents`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      })
  })

  it('should pass search query params through', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get(
        '/completed-incidents?prisonNumber=A1234AA&reporter=Bob&dateFrom=9 Jan 2020&dateTo=15 Jan 2020&prisonerName=Jimmy Choo'
      )
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
        expect(reviewService.getCompletedReports).toHaveBeenCalledWith('user1', 'LEI', {
          dateFrom: parseDate('9 Jan 2020', 'D MMM YYYY'),
          dateTo: parseDate('15 Jan 2020', 'D MMM YYYY'),
          prisonNumber: 'A1234AA',
          reporter: 'Bob',
          prisonerName: 'Jimmy Choo',
        })
      })
  })

  it('should pass handle invalid dates', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get('/completed-incidents?prisonNumber=A1234AA&reporter=Bob&dateFrom=&dateTo=blarh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
        expect(reviewService.getCompletedReports).toHaveBeenCalledWith('user1', 'LEI', {
          prisonNumber: 'A1234AA',
          reporter: 'Bob',
        })
      })
  })

  it('should not allow if not reviewer', () => {
    userSupplier.mockReturnValue(user)
    return request(app)
      .get('/completed-incidents')
      .expect(401)
      .expect(res => expect(res.text).toContain('Not authorised to access this resource'))
  })
})

describe(`GET /not-completed-incidents`, () => {
  it('should render page for reviewer', () => {
    userSupplier.mockReturnValue(reviewerUser)

    return request(app)
      .get(`/not-completed-incidents`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      })
  })

  it('should not allow if not reviewer', () => {
    userSupplier.mockReturnValue(user)
    return request(app)
      .get('/not-completed-incidents')
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
    return request(app).get('/1/view-statements').expect(500)
  })
})
