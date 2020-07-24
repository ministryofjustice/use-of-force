import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import StatementService from '../services/statementService'

jest.mock('../services/statementService')

const statementService = new StatementService(jest.fn() as any, jest.fn() as any, jest.fn() as any) as jest.Mocked<
  StatementService
>

const offenderService = {
  getOffenderNames: () => [],
  getOffenderDetails: () => ({ displayName: 'Jimmy Choo', offenderNo: '123456' }),
}

let app

beforeEach(() => {
  statementService.validateSavedStatement.mockResolvedValue([])
  statementService.getStatements.mockResolvedValue({
    items: [],
    metaData: { min: 0, max: 0, page: 1, totalCount: 1, totalPages: 1 },
  })
  statementService.getStatementForUser.mockResolvedValue({
    id: 1,
    booking_id: 2,
    created_date: '12/12/2018',
    user_id: 'ITAG_USER',
    statement: 'Some initial statement',
  })
  app = appWithAllRoutes({ statementService, offenderService })
})

describe('GET /your-statements', () => {
  it('should render page', () =>
    request(app)
      .get('/your-statements')
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
      .send('submitType=save-and-return')
      .expect(302)
      .expect('Location', '/your-statements'))

  it('save and continue with invalid data will redirect to same page', () =>
    request(app)
      .post('/-1/write-your-statement')
      .send('submitType=save-and-continue')
      .expect(302)
      .expect('Location', '/-1/write-your-statement'))

  it('save and continue with valid data should forward to confirm page', () =>
    request(app)
      .post('/-1/write-your-statement')
      .send('submitType=save-and-continue&statement=bob&jobStartYear=1999&lastTrainingMonth=1&lastTrainingYear=1999')
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
    statementService.validateSavedStatement.mockResolvedValue([{ href: '#field', text: 'An error' }])
    return request(app).post('/-1/check-your-statement').expect(302).expect('Location', '/-1/write-your-statement')
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

describe('POST /:reportId/add-comment-to-statement', () => {
  it('should save amendment', () =>
    request(app)
      .post('/-1/add-comment-to-statement')
      .send('additionalComment=statement1&submitType=true')
      .expect(302)
      .expect('Location', '/your-statements')
      .expect(() => {
        expect(statementService.saveAdditionalComment).toBeCalledWith(1, 'statement1')
      }))
})

describe('GET /:reportId/add-comment-to-statement', () => {
  it('should render page', () =>
    request(app)
      .get('/-1/add-comment-to-statement')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Add a comment to your statement')
        expect(res.text).toContain(1)
        expect(res.text).toContain('Jimmy Choo')
        expect(res.text).toContain('Some initial statement')
      }))
})
