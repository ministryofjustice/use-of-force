import request from 'supertest'
import { DraftReportService, OffenderService } from '../../services'
import { appWithAllRoutes } from '../__test/appSetup'

jest.mock('../../services/offenderService')
jest.mock('../../services/drafts/draftReportService')

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null,
) as jest.Mocked<DraftReportService>

let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, offenderService })
  offenderService.getOffenderDetails.mockResolvedValue({})
  draftReportService.getCurrentDraft.mockResolvedValue(null)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/report-may-already-exist', () => {
  describe('GET', () => {
    it('should get offender name', () => {
      return request(app)
        .get('/report/2/report-may-already-exist')
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(offenderService.getOffenderDetails).toBeCalledTimes(1)
          expect(offenderService.getOffenderDetails).toBeCalledWith('user1-system-token', 2)
        })
    })

    it('should get current draft report', () => {
      return request(app)
        .get('/report/3/report-may-already-exist')
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(draftReportService.getCurrentDraft).toBeCalledTimes(1)
          expect(draftReportService.getCurrentDraft).toBeCalledWith('user1', 3)
        })
    })

    it('should redirect if no current draft report', () => {
      draftReportService.getCurrentDraft.mockResolvedValue({ id: null })
      return request(app)
        .get('/report/3/report-may-already-exist')
        .expect(302)
        .expect('Location', '/report/3/report-has-been-deleted')
    })
  })

  describe('POST', () => {
    it('should redirect to same page as user not selected either radio', () => {
      return request(app)
        .post('/report/1/report-may-already-exist')
        .send({ cancelReport: undefined })
        .expect(302)
        .expect('Location', '/report/1/report-may-already-exist')
    })
    it('should redirect to report-cancelled', () => {
      return request(app)
        .post('/report/1/report-may-already-exist')
        .send({ cancelReport: 'true' })
        .expect(302)
        .expect('Location', '/report/1/report-cancelled')
    })

    it('should redirect to tasklist as user did not select save-and-continue button', () => {
      return request(app)
        .post('/report/1/report-may-already-exist')
        .send({ cancelReport: 'false' })
        .expect(302)
        .expect('Location', '/report/1/report-use-of-force')
    })
  })
})
