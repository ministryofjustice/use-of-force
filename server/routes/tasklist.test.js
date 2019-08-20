const request = require('supertest')
const { appSetup } = require('./testutils/appSetup')
const createRouter = require('./tasklist')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const reportService = {
  getCurrentDraft: jest.fn(),
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
      .get('/-35')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force task list')
      }))
})
