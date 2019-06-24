const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./tasklist')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const formService = {
  getFormResponse: jest.fn(),
}

const tasklistRoute = createRouter({ formService, authenticationMiddleware })

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  formService.getFormResponse.mockResolvedValue({})
})

afterEach(() => {
  formService.getFormResponse.mockReset()
})

describe('GET /tasklist', () => {
  it('should render page content', () =>
    request(app)
      .get('/-35')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Task list')
      }))
})
