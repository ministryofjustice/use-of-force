import request from 'supertest'
import { AuthService, DraftReportService, OffenderService } from '../../services'
import { appWithAllRoutes } from '../__test/appSetup'

jest.mock('../../services/offenderService')
jest.mock('../../services/authService')
jest.mock('../../services/drafts/draftReportService')

const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<DraftReportService>

let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, offenderService, authService })
  draftReportService.getCurrentDraft.mockResolvedValue({})
  offenderService.getOffenderDetails.mockResolvedValue({})
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /task-list', () => {
  it('should render page content for new report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({})
    return request(app)
      .get('/report/-35/report-use-of-force')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Report use of force')
        expect(offenderService.getOffenderDetails).toBeCalledWith('user1-system-token', '-35')
      })
  })

  it('should render page content for existing report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1' })
    return request(app)
      .get('/report/-35/report-use-of-force')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Report use of force')
        expect(offenderService.getOffenderDetails).toBeCalledWith('user1-system-token', '-35')
      })
  })

  it('shows the exit link', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1' })
    return request(app)
      .get('/report/-35/report-use-of-force')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/<a href=".*?" .*? data-qa="exit-to-dps-link">Exit to Digital Prison Services<\/a>/)
      })
  })
})
