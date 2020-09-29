import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import { PageResponse } from '../utils/page'
import ReportService from '../services/report/reportService'
import OffenderService from '../services/offenderService'

jest.mock('../services/report/reportService')
jest.mock('../services/offenderService')

const userSupplier = jest.fn()

const reportService = new ReportService(null, null, null) as jest.Mocked<ReportService>

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>

const reportDetailBuilder = {
  build: jest.fn().mockResolvedValue({ id: 1, form: { incidentDetails: {} } }),
}

let app

beforeEach(() => {
  userSupplier.mockReturnValue(user)
  app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder }, userSupplier)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incidents', () => {
  it('should render page', () => request(app).get('/').expect(302).expect('Location', '/your-statements'))
})

describe('GET /your-report', () => {
  it('should render page', () => {
    reportService.getReport.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })
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
})
