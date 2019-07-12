const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./tasklist')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const formService = {
  getFormResponse: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
}

const tasklistRoute = createRouter({ authenticationMiddleware, formService, offenderService })

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  formService.getFormResponse.mockResolvedValue({})
  offenderService.getOffenderDetails.mockResolvedValue({})
})

afterEach(() => {
  formService.getFormResponse.mockReset()
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
