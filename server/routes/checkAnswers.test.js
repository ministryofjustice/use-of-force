const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./checkAnswers')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const checkAnswersRoute = createRouter({ authenticationMiddleware })

let app

beforeEach(() => {
  app = appSetup(checkAnswersRoute)
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
