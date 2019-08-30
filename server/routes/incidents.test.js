const request = require('supertest')
const { appSetup } = require('./testutils/appSetup')
const createRouter = require('./index')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const statementService = {
  getStatementsForUser: () => [{ id: 1, booking_id: 2, created_date: '12/12/2018', user_id: 'ITAG_USER' }],
  getStatement: () => ({ id: 1, booking_id: 2, created_date: '12/12/2018', user_id: 'ITAG_USER' }),
  submitStatement: jest.fn(),
  save: jest.fn(),
  validateSavedStatement: jest.fn(),
  saveAdditionalComment: jest.fn(),
}

const offenderService = {
  getOffenderNames: () => [],
  getOffenderDetails: () => ({}),
}
const route = createRouter({ authenticationMiddleware, statementService, offenderService })

let app

beforeEach(() => {
  statementService.validateSavedStatement.mockReturnValue([])

  app = appSetup(route)
})

describe('GET /incidents', () => {
  it('should render page', () =>
    request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      }))
})

describe('GET /:reportId/write-your-statement', () => {
  it('should render page', () =>
    request(app)
      .get('/-1/write-your-statement')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Your use of force statement')
      }))
})

describe('POST /:reportId/write-your-statement', () => {
  it('save and return should redirect to incidents page', () =>
    request(app)
      .post('/-1/write-your-statement')
      .send('submit=save-and-return')
      .expect(302)
      .expect('Location', '/'))

  it('save and continue with invalid data will redirect to same page', () =>
    request(app)
      .post('/-1/write-your-statement')
      .send('submit=save-and-continue')
      .expect(302)
      .expect('Location', '/-1/write-your-statement'))

  it('save and continue with valid data should forward to confirm page', () =>
    request(app)
      .post('/-1/write-your-statement')
      .send('submit=save-and-continue&statement=bob&jobStartYear=1999&lastTrainingMonth=1&lastTrainingYear=1999')
      .expect(302)
      .expect('Location', '/-1/check-your-statement'))
})

describe('POST /:reportId/check-your-statement', () => {
  it('submit redirects to submitted', () =>
    request(app)
      .post('/-1/check-your-statement')
      .send('confirmed=confirmed')
      .expect(302)
      .expect('Location', '/-1/statement-submitted'))

  it('submit redirects due to form not being complete', () => {
    statementService.validateSavedStatement.mockReturnValue([{ href: '#field', text: 'An error' }])
    return request(app)
      .post('/-1/check-your-statement')
      .expect(302)
      .expect('Location', '/-1/write-your-statement')
  })
})

describe('GET /:reportId/statement-submitted', () => {
  it('should render page', () =>
    request(app)
      .get('/-1/statement-submitted')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Your statement has been submitted')
      }))
})

describe('GET /:reportId/your-statement', () => {
  it('should render page', () =>
    request(app)
      .get('/-1/your-statement')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Your use of force statement')
      }))
})

describe('POST /:reportId/your-statement', () => {
  it('should save ammendment', () =>
    request(app)
      .post('/-1/your-statement')
      .send('additionalContent=statement1&submit=true')
      .expect(302)
      .expect('Location', '/-1/your-statement')
      .expect(res => {
        expect(statementService.saveAdditionalComment).toBeCalledWith(1, 'statement1')
      }))
})
