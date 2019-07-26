const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./tasklist')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const incidentService = {
  getFormResponse: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
}

const tasklistRoute = createRouter({ authenticationMiddleware, incidentService, offenderService })

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  incidentService.getFormResponse.mockResolvedValue({})
  offenderService.getOffenderDetails.mockResolvedValue({})
})

afterEach(() => {
  incidentService.getFormResponse.mockReset()
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
