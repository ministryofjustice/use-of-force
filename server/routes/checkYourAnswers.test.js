const request = require('supertest')
const { appWithAllRoutes, user } = require('./testutils/appSetup')

const reportService = {
  getCurrentDraft: jest.fn(),
  isDraftComplete: jest.fn(),
  submit: jest.fn(),
  getReportStatus: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
  getLocation: jest.fn(),
}

const involvedStaffService = {
  getDraftInvolvedStaff: () => [],
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ reportService, offenderService, involvedStaffService })
  reportService.getCurrentDraft.mockResolvedValue({ form: { incidentDetails: {} } })

  offenderService.getOffenderDetails.mockResolvedValue({})
  offenderService.getLocation.mockResolvedValue({})
})

describe('GET /check-your-answers', () => {
  it('Allow render if report is complete', () => {
    reportService.getReportStatus.mockReturnValue({ complete: true })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers')
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('user1-system-token', -35)
      })
  })

  it('Redirect if report is not complete', () => {
    reportService.getReportStatus.mockReturnValue({ complete: false })

    return request(app)
      .get('/report/-35/check-your-answers')
      .expect(302)
      .expect('Location', '/')
  })
})

describe('POST /check-your-answers', () => {
  it('Allow submit if report is complete', async () => {
    reportService.isDraftComplete.mockReturnValue(true)
    reportService.submit.mockReturnValue(2)

    await request(app)
      .post('/report/-35/check-your-answers')
      .expect(302)
      .expect('Location', '/2/report-sent')
    expect(reportService.submit).toBeCalledWith(user, '-35')
  })

  it('An error is throw if the report is not complete', async () => {
    reportService.isDraftComplete.mockReturnValue(false)

    await request(app)
      .post('/report/-35/check-your-answers')
      .expect(500)

    expect(reportService.submit).not.toBeCalledWith()
  })
})
