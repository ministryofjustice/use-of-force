import request from 'supertest'
import { addDays, subDays, subWeeks } from 'date-fns'
import { appWithAllRoutes } from '../__test/appSetup'
import OffenderService from '../../services/offenderService'
import AuthService from '../../services/authService'
import DraftReportService from '../../services/drafts/draftReportService'
import config from '../../config'

jest.mock('../../services/offenderService')
jest.mock('../../services/authService')
jest.mock('../../services/drafts/draftReportService')

const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
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
const submissionWindow = config.maxWeeksFromIncidentDateToSubmitOrEditReport
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
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('-35', 'user1')
      })
  })

  it('should render page content for existing report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1' })
    return request(app)
      .get('/report/-35/report-use-of-force')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Report use of force')
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('-35', 'user1')
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

  it(`should prevent report submission if incident date is more than ${submissionWindow} weeks ago`, async () => {
    const incidentDate = subDays(subWeeks(new Date(), submissionWindow), 1).toISOString()
    draftReportService.getCurrentDraft.mockResolvedValue({ incidentDate })
    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(false)
    offenderService.getOffenderDetails.mockResolvedValue({
      displayName: 'John Doe',
      offenderNo: 'A1234BC',
      dateOfBirth: '1990-01-01',
    })
    const res = await request(app).get('/report/-35/report-use-of-force')
    expect(res.text).toContain('You can not edit or submit this report')
    expect(res.text).not.toContain('Check then send report')
    expect(res.text).toContain('Return to use of force incidents')
  })

  it(`should NOT prevent report submission if incident date exactly  ${submissionWindow} weeks ago`, async () => {
    const incidentDate = subWeeks(new Date(), submissionWindow).toISOString()
    draftReportService.getCurrentDraft.mockResolvedValue({ incidentDate })
    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(true)
    offenderService.getOffenderDetails.mockResolvedValue({
      displayName: 'John Doe',
      offenderNo: 'A1234BC',
      dateOfBirth: '1990-01-01',
    })
    const res = await request(app).get('/report/-35/report-use-of-force')
    expect(res.text).not.toContain('You can not edit or submit this report')
    expect(res.text).toContain('Check then send report')
    expect(res.text).toContain('Exit to Digital Prison Services')
  })

  it(`should NOT prevent report submission if incident date is less than ${submissionWindow} weeks ago`, async () => {
    const incidentDate = addDays(subWeeks(new Date(), submissionWindow), 1).toISOString()
    draftReportService.getCurrentDraft.mockResolvedValue({ incidentDate })
    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(true)
    offenderService.getOffenderDetails.mockResolvedValue({
      displayName: 'John Doe',
      offenderNo: 'A1234BC',
      dateOfBirth: '1990-01-01',
    })
    const res = await request(app).get('/report/-35/report-use-of-force')
    expect(res.text).not.toContain('You can not edit or submit this report')
    expect(res.text).toContain('Check then send report')
    expect(res.text).toContain('Exit to Digital Prison Services')
  })

  it('should NOT prevent report submission if there is no incident date', async () => {
    draftReportService.getCurrentDraft.mockResolvedValue({})
    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(true)
    offenderService.getOffenderDetails.mockResolvedValue({
      displayName: 'John Doe',
      offenderNo: 'A1234BC',
      dateOfBirth: '1990-01-01',
    })
    const res = await request(app).get('/report/-35/report-use-of-force')
    expect(res.text).not.toContain('You can not edit or submit this report')
    expect(res.text).toContain('Check then send report')
    expect(res.text).toContain('Exit to Digital Prison Services')
  })
})
