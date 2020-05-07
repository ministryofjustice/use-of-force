const request = require('supertest')
const { appWithAllRoutes } = require('./testutils/appSetup')

let app

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /search-for-prisoner', () => {
  it('should render page with no results', () => {
    return request(app)
      .get('/search-for-prisoner')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).not.toContain('id="search-results"')
      })
  })

  it('should render page with results', () => {
    return request(app)
      .get('/search-for-prisoner?prisonNumber=AAA123AV')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).toContain('id="search-results"')
        expect(res.text).toContain('Showing 3 results')
        expect(res.text).toContain('Norman Bates')
      })
  })
})

describe('POST /search-for-prisoner', () => {
  it('should redirect to search page with terms', () => {
    return request(app)
      .post('/search-for-prisoner')
      .send({ agencyId: 'MDI', prisonNumber: 'AAA123AV', firstName: 'Brian', lastName: 'Jones' })
      .expect('Location', '/search-for-prisoner?prisonNumber=AAA123AV&firstName=Brian&lastName=Jones&agencyId=MDI')
  })

  it('if terms are absent then they are not included', () => {
    return request(app)
      .post('/search-for-prisoner')
      .send({ agencyId: 'MDI', lastName: 'Jones' })
      .expect('Location', '/search-for-prisoner?lastName=Jones&agencyId=MDI')
  })
})
