import request from 'supertest'
import { appWithAllRoutes, coordinatorUser, reviewerUser, user } from '../__test/appSetup'
import { PageResponse } from '../../utils/page'
import { Report } from '../../data/incidentClientTypes'
import ReportService, { IncidentSummary } from '../../services/reportService'
import OffenderService from '../../services/offenderService'
import AuthService from '../../services/authService'
import ReportDetailBuilder from '../../services/reportDetailBuilder'
import config from '../../config'

jest.mock('../../services/reportService')
jest.mock('../../services/authService')
jest.mock('../../services/offenderService')
jest.mock('../../services/reportDetailBuilder')

const userSupplier = jest.fn()

const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const reportDetailBuilder = new ReportDetailBuilder(null, null, null, null, null) as jest.Mocked<ReportDetailBuilder>
const report = { id: 1, form: { incidentDetails: {} } } as unknown as Report

let app

beforeEach(() => {
  reportService.getReports.mockResolvedValue({
    metaData: {
      page: 1,
      totalCount: 2,
      min: 1,
      max: 2,
      totalPages: 1,
      previousPage: null,
      nextPage: null,
    },
    items: [
      {
        id: 2,
        bookingId: 541867,
        incidentdate: new Date(),
        staffMemberName: 'Bob',
        offenderName: 'Offender A',
        offenderNo: 'A12345B',
        status: 'SUBMITTED',
      },
    ],
  } as unknown as PageResponse<IncidentSummary>)
  userSupplier.mockReturnValue(user)
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder, authService }, userSupplier)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incidents', () => {
  it('should render page', () => request(app).get('/').expect(302).expect('Location', '/your-statements'))
})

describe('GET /your-report', () => {
  it('should render page', () => {
    reportService.getReport.mockResolvedValue(report)
    return request(app)
      .get('/1/your-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force report')
      })
  })
})
describe('GET /your-reports', () => {
  it('should render page', () => {
    reportService.getReports.mockResolvedValue(
      new PageResponse({ min: 0, max: 0, page: 1, totalCount: 0, totalPages: 0 }, [])
    )
    return request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Your reports')
      })
  })

  it('should display View report link for all users', () => {
    config.featureFlagReportEditingEnabled = false

    return request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('View report')
      })
  })
  it('should display View report link for reporter', () => {
    config.featureFlagReportEditingEnabled = true

    return request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('View report')
      })
  })

  it('should display View incident link for coordinator', () => {
    config.featureFlagReportEditingEnabled = true
    userSupplier.mockReturnValue(coordinatorUser)
    app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder, authService }, userSupplier)

    return request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('View incident')
      })
  })

  it('should display View incident link for reviewer', () => {
    config.featureFlagReportEditingEnabled = true
    userSupplier.mockReturnValue(reviewerUser)
    app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder, authService }, userSupplier)

    return request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('View incident')
      })
  })

  it('should provide correct href to view report link in old view', () => {
    config.featureFlagReportEditingEnabled = false
    userSupplier.mockReturnValue(reviewerUser)
    app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder, authService }, userSupplier)

    return request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('/your-report')
      })
  })

  it('should provide correct href to view incident link in new view', () => {
    config.featureFlagReportEditingEnabled = true
    userSupplier.mockReturnValue(reviewerUser)
    app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder, authService }, userSupplier)

    return request(app)
      .get('/your-reports')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('/view-incident?tab=report')
      })
  })
})
