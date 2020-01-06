const request = require('supertest')
const { appSetup } = require('./testutils/appSetup')
const createRouter = require('./index')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const reportService = {
  getCurrentDraft: jest.fn(),
  getReportStatus: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
}

const tasklistRoute = createRouter({ authenticationMiddleware, reportService, offenderService })

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
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
