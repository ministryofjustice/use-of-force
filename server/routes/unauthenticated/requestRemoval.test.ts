import request from 'supertest'
import { ReportService } from '../../services'
import type { AnonReportSummaryWithPrison } from '../../services/reportService'
import { appWithAllRoutes } from '../__test/appSetup'

jest.mock('../../services/reportService')

describe('Request removal controller', () => {
  const reportService = new ReportService(null, null, null, null) as jest.Mocked<ReportService>

  let app

  const report: AnonReportSummaryWithPrison = {
    statementId: 1,
    incidentDate: new Date(1),
    agencyId: 'MDI',
    prisonName: 'Moorland HMP',
  }

  beforeEach(() => {
    app = appWithAllRoutes({ reportService, systemToken: async _ => `system-token` })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /request-removal', () => {
    it('should render page', () => {
      reportService.getAnonReportSummary.mockResolvedValue(report)
      return request(app)
        .get('/request-removal/1')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Request to be removed from a use of force incident')
          expect(reportService.getAnonReportSummary).toHaveBeenCalledWith('system-token', 1)
        })
    })
  })
})
