const request = require('supertest')
const { appWithAllRoutes } = require('./testutils/appSetup')

const reportService = {
  getCurrentDraft: jest.fn(),
  getReportStatus: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ reportService, offenderService })
  reportService.getCurrentDraft.mockResolvedValue({})
  offenderService.getOffenderDetails.mockResolvedValue({})
})

afterEach(() => {
  reportService.getCurrentDraft.mockReset()
})

describe('GET /task-list', () => {
  it('should render page content', () =>
    request(app)
      .get('/report/-35/report-use-of-force')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Report use of force')
      }))
})
