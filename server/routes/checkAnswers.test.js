const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./checkAnswers')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const formService = {
  getFormResponse: jest.fn(),
}

const checkAnswersRoute = createRouter({ formService, authenticationMiddleware })

let app

beforeEach(() => {
  app = appSetup(checkAnswersRoute)
  formService.getFormResponse.mockResolvedValue({})
})

afterEach(() => {
  formService.getFormResponse.mockReset()
})

describe('GET /check-answers', () => {
  it('should render page content', () =>
    request(app)
      .get('/-35')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers')
      }))
})
