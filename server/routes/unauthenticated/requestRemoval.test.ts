import request from 'supertest'
import config from '../../config'
import { paths } from '../../config/incident'
import { ReportService, StatementService } from '../../services'
import type { AnonReportSummaryWithPrison } from '../../services/reportService'
import { stringToHash } from '../../utils/hash'
import { appWithAllRoutes } from '../__test/appSetup'

jest.mock('../../services/reportService')
jest.mock('../../services/statementService')

describe('Request removal controller', () => {
  const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
  const statementService = new StatementService(null, null, null) as jest.Mocked<StatementService>

  let app
  let flash

  const report: AnonReportSummaryWithPrison = {
    statementId: 1,
    incidentDate: new Date(1),
    agencyId: 'MDI',
    prisonName: 'Moorland HMP',
    isRemovalRequested: false,
  }

  beforeEach(() => {
    flash = jest.fn().mockReturnValue([])
    app = appWithAllRoutes(
      { reportService, statementService, systemToken: async _ => `system-token` },
      undefined,
      undefined,
      flash,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /request-removal/:statementId', () => {
    const validSignature = encodeURIComponent(stringToHash('1', config.email.urlSigningSecret))
    const invalidSignature = encodeURIComponent(stringToHash('2', config.email.urlSigningSecret))

    it('should render page on valid signature', () => {
      reportService.getAnonReportSummary.mockResolvedValue(report)
      return request(app)
        .get(paths.requestRemoval(1, validSignature))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Request to be removed from a use of force incident')
          expect(reportService.getAnonReportSummary).toHaveBeenCalledWith('system-token', 1)
        })
    })

    it('should redirect when missing statement', () => {
      reportService.getAnonReportSummary.mockResolvedValue(null)
      return request(app)
        .get(paths.requestRemoval(1, validSignature))
        .expect(302)
        .expect('Location', paths.alreadyRemoved())
    })

    it('should redirect when already requested', () => {
      reportService.getAnonReportSummary.mockResolvedValue({ ...report, isRemovalRequested: true })
      return request(app)
        .get(paths.requestRemoval(1, validSignature))
        .expect(302)
        .expect('Location', paths.removalAlreadyRequested())
    })

    it('should redirect on invalid signature', () => {
      reportService.getAnonReportSummary.mockResolvedValue(report)
      return request(app).get(paths.requestRemoval(1, invalidSignature)).expect(404)
    })
  })

  describe('POST /request-removal/:statementId', () => {
    const validSignature = stringToHash('1', config.email.urlSigningSecret)
    const invalidSignature = stringToHash('2', config.email.urlSigningSecret)

    it('should successfully request removal from statement', () =>
      request(app)
        .post(paths.requestRemoval(1, null))
        .send({ reason: 'reason', signature: validSignature })
        .expect(302)
        .expect('Location', paths.removalRequested())
        .expect(() => {
          expect(statementService.requestStatementRemoval).toBeCalledWith(1, 'reason')
        }))

    it('should fail to request removal from statement when no signature', () =>
      request(app)
        .post(paths.requestRemoval(1, null))
        .send({ reason: 'reason', signature: invalidSignature })
        .expect(404)
        .expect(() => {
          expect(statementService.requestStatementRemoval).not.toBeCalled()
        }))

    it('request to be removed redirects when a reason is not provided', () =>
      request(app)
        .post(paths.requestRemoval(1, null))
        .send({ signature: validSignature })
        .expect(302)
        .expect('Location', `/request-removal/1?signature=${encodeURIComponent(validSignature)}`)
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

  describe('GET /removal-requested', () => {
    it('should render page', () =>
      request(app)
        .get(paths.removalRequested())
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Your request has been submitted')
        }))
  })

  describe('GET /already-removed', () => {
    it('should render page', () =>
      request(app)
        .get(paths.alreadyRemoved())
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Your request has been submitted')
          expect(res.text).toContain('You no longer need to complete a statement.')
        }))
  })

  describe('GET /removal-already-requested', () => {
    it('should render page', () =>
      request(app)
        .get(paths.removalAlreadyRequested())
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('You have already requested to be removed from this use of force incident')
        }))
  })
})
