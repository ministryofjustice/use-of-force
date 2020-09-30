import request from 'supertest'
import { appWithAllRoutes, user, reviewerUser } from './testutils/appSetup'
import { parseDate } from '../utils/utils'
import { PageResponse } from '../utils/page'
import type { ReportDetail } from '../services/reportDetailBuilder'
import { OffenderService, ReviewService, ReportDetailBuilder } from '../services'

const userSupplier = jest.fn()

jest.mock('../services/reviewService')
jest.mock('../services/offenderService')
jest.mock('../services/reportDetailBuilder')

const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const reportDetailBuilder = new ReportDetailBuilder(null, null, null, null) as jest.Mocked<ReportDetailBuilder>

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  reviewService.getReport.mockResolvedValue({})
  app = appWithAllRoutes({ offenderService, reviewService, reportDetailBuilder }, userSupplier)
  reviewService.getIncompleteReports.mockResolvedValue([])
  reviewService.getCompletedReports.mockResolvedValue(
    new PageResponse({ min: 0, max: 0, page: 1, totalCount: 0, totalPages: 1 }, [])
  )
  offenderService.getOffenderDetails.mockResolvedValue({ displayName: 'Jimmy Choo', offenderNo: '123456' })
  reportDetailBuilder.build.mockResolvedValue({} as ReportDetail)
})

afterEach(() => {
  jest.resetAllMocks()
})

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
        expect(reviewService.getCompletedReports).toHaveBeenCalledWith(
          'user1',
          'LEI',
          {
            dateFrom: parseDate('9 Jan 2020', 'D MMM YYYY'),
            dateTo: parseDate('15 Jan 2020', 'D MMM YYYY'),
            prisonNumber: 'A1234AA',
            reporter: 'Bob',
            prisonerName: 'Jimmy Choo',
          },
          1
        )
      })
  })

  it('should pass search query params through to page params', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getCompletedReports.mockResolvedValue(
      new PageResponse(
        { min: 1, max: 20, totalCount: 200, totalPages: 10, page: 1, nextPage: 2, previousPage: null },
        []
      )
    )
    return request(app)
      .get(
        '/completed-incidents?prisonNumber=A1234AA&reporter=Bob&dateFrom=9 Jan 2020&dateTo=15 Jan 2020&prisonerName=Jimmy Choo'
      )
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          '<a class="moj-pagination__link" href="?prisonNumber=A1234AA&amp;reporter=Bob&amp;dateFrom=9%20Jan%202020&amp;dateTo=15%20Jan%202020&amp;prisonerName=Jimmy%20Choo&amp;page=3">3</a>'
        )
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
        expect(reviewService.getCompletedReports).toHaveBeenCalledWith(
          'user1',
          'LEI',
          {
            prisonNumber: 'A1234AA',
            reporter: 'Bob',
          },
          1
        )
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
        expect(reviewService.getIncompleteReports).toHaveBeenCalledWith('user1', 'LEI')
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
    reviewService.getReport.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })
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
    reviewService.getReport.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })
    reviewService.getStatements.mockResolvedValue([])
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
    reviewService.getReport.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })
    reviewService.getStatements.mockResolvedValue([])
    return request(app)
      .get('/1/view-statements')
      .expect(401)
      .expect(res => expect(res.text).toContain('Not authorised to access this resource'))
  })

  it('should error if report doesnt exist', () => {
    userSupplier.mockReturnValue(reviewerUser)
    reviewService.getReport.mockReturnValue(null)
    reviewService.getStatements.mockResolvedValue([])
    return request(app).get('/1/view-statements').expect(500)
  })
})
