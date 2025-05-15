import request from 'supertest'
import moment from 'moment'
import { appWithAllRoutes, user } from '../__test/appSetup'
import { PageResponse } from '../../utils/page'
import { Report } from '../../data/incidentClientTypes'
import ReportService from '../../services/reportService'
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
const reportEdit = {
  id: 1,
  editDate: moment('2025-05-13 10:30:43.122'),
  editorUserId: 'TOM_ID',
  editorName: 'TOM',
  reportId: 1,
  changeTo: 'PAVA',
  oldValuePrimary: 'true',
  newValuePrimary: 'false',
  reason: 'chose wrong answer',
  reportOwnerChanged: false,
}

let app

beforeEach(() => {
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

  it('should not include report edits', () => {
    reportService.getReport.mockResolvedValue(report)
    reportService.getReportEdits.mockResolvedValue([])
    return request(app)
      .get('/1/your-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force report')
        expect(res.text).not.toContain('Report last edited')
        expect(res.text).not.toContain('Current report owner')
      })
  })

  it('should include report edits but not change owner', () => {
    config.featureFlagReportEditingEnabled = true
    app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder }, userSupplier)

    reportService.getReport.mockResolvedValue(report)
    reportService.getReportEdits.mockResolvedValue([reportEdit])
    return request(app)
      .get('/1/your-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force report')
        expect(res.text).toContain('Report last edited')
        expect(res.text).not.toContain('Current report owner')
      })
  })

  it('should include report edits including new report owner', () => {
    config.featureFlagReportEditingEnabled = true
    app = appWithAllRoutes({ reportService, offenderService, reportDetailBuilder }, userSupplier)

    reportService.getReport.mockResolvedValue(report)
    reportService.getReportEdits.mockResolvedValue([
      { ...reportEdit, reportOwnerChanged: true, newValuePrimary: 'BOB (BOB_ID)' },
    ])
    return request(app)
      .get('/1/your-report')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force report')
        expect(res.text).toContain('Report last edited')
        expect(res.text).toContain('Current report owner')
        expect(res.text).toContain('BOB (BOB_ID)')
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
