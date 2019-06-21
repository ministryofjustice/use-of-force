const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./tasklist')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const formService = {
  getFormResponse: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
}

const tasklistRoute = createRouter({ formService, authenticationMiddleware })

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  formService.getFormResponse.mockResolvedValue({})
})

afterEach(() => {
  formService.getFormResponse.mockReset()
  formService.update.mockReset()
})

describe('GET /tasklist', () => {
  test.each`
    path     | expectedContent
    ${'-35'} | ${'Task list'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )
})
