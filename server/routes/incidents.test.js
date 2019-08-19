const request = require('supertest')
const { appSetup } = require('./testutils/appSetup')
const createRouter = require('./incidents')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const incidentService = {
  getStatementsForUser: () => [{ id: 1, booking_id: 2, created_date: '12/12/2018', user_id: 'ITAG_USER' }],
  getStatement: () => ({ id: 1, booking_id: 2, created_date: '12/12/2018', user_id: 'ITAG_USER' }),
  submitStatement: jest.fn(),
  saveStatement: jest.fn(),
  processUserInput: () => ({}),
}

const offenderService = {
  getOffenderNames: () => [],
  getOffenderDetails: () => ({}),
}
const route = createRouter({ authenticationMiddleware, incidentService, offenderService })

let app

beforeEach(() => {
  app = appSetup(route)
})

describe('GET /', () => {
  it('should redirect to /incidents', () =>
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/incidents'))
})

describe('GET /incidents', () => {
  it('should render page', () =>
    request(app)
      .get('/incidents/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force incidents')
      }))
})

describe('GET /incidents/:incidentId/statement', () => {
  it('should render page', () =>
    request(app)
      .get('/incidents/-1/statement')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force statement')
      }))
})

describe('POST /incidents/:incidentId/statement', () => {
  it('save and return should redirect to incidents page', () =>
    request(app)
      .post('/incidents/-1/statement')
      .send('submit=save-and-return')
      .expect(302)
      .expect('Location', '/incidents/'))

  it('save and continue with invalid data will redirect to same page', () =>
    request(app)
      .post('/incidents/-1/statement')
      .send('submit=save-and-continue')
      .expect(302)
      .expect('Location', '/incidents/-1/statement'))

  it('save and continue with valid data should forward to confirm page', () =>
    request(app)
      .post('/incidents/-1/statement')
      .send('submit=save-and-continue&statement=bob&jobStartYear=1999&lastTrainingMonth=1&lastTrainingYear=1999')
      .expect(302)
      .expect('Location', '/incidents/-1/statement/confirm'))
})

describe('POST /incidents/:incidentId/statement/confirm', () => {
  it('unconfirmed submit redirects due to validation', () =>
    request(app)
      .post('/incidents/-1/statement/confirm')
      .expect(302)
      .expect('Location', '/incidents/-1/statement/confirm'))

  it('confirmed submit redirects to submitted', () =>
    request(app)
      .post('/incidents/-1/statement/confirm')
      .send('confirmed=confirmed')
      .expect(302)
      .expect('Location', '/incidents/-1/statement/submitted'))
})

describe('GET /incidents/:incidentId/statement', () => {
  it('should render page', () =>
    request(app)
      .get('/incidents/-1/statement/submitted')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Statement submitted')
      }))
})
