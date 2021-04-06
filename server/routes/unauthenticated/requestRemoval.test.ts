import request from 'supertest'
import { ReportService, StatementService } from '../../services'
import type { AnonReportSummaryWithPrison } from '../../services/reportService'
import { appWithAllRoutes } from '../__test/appSetup'

jest.mock('../../services/reportService')
jest.mock('../../services/statementService')

describe('Request removal controller', () => {
  const reportService = new ReportService(null, null, null, null) as jest.Mocked<ReportService>
  const statementService = new StatementService(null, null, null) as jest.Mocked<StatementService>

  let app
  let flash

  const report: AnonReportSummaryWithPrison = {
    statementId: 1,
    incidentDate: new Date(1),
    agencyId: 'MDI',
    prisonName: 'Moorland HMP',
  }

  beforeEach(() => {
    flash = jest.fn().mockReturnValue([])
    app = appWithAllRoutes(
      { reportService, statementService, systemToken: async _ => `system-token` },
      undefined,
      undefined,
      flash
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /request-removal/:statementId', () => {
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

  describe('GET /removal-requested', () => {
    it('should render page', () =>
      request(app)
        .get('/removal-requested')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Your request has been submitted')
        }))
  })

  describe('POST /request-removal/:statementId', () => {
    it('should sccessfully request removal from statement', () =>
      request(app)
        .post('/request-removal/1')
        .send({ reason: 'reason' })
        .expect(302)
        .expect('Location', '/removal-requested')
        .expect(() => {
          expect(statementService.requestStatementRemoval).toBeCalledWith(1, 'reason')
        }))

    it('request to be removed redirects when a reason is not provided', () =>
      request(app)
        .post('/request-removal/1')
        .expect(302)
        .expect('Location', '/request-removal/1')
        .expect(() => {
          expect(statementService.requestStatementRemoval).not.toBeCalled()
          expect(flash).toBeCalledWith('errors', [
            {
              text: 'Enter why you should be removed from this incident',
              href: '#reason',
            },
          ])
        }))
  })
})
