import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'

let app
let prisonerSearchService

beforeEach(() => {
  prisonerSearchService = {
    search: jest.fn(),
    getPrisons: jest.fn().mockResolvedValue([]),
  }
  app = appWithAllRoutes({ prisonerSearchService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /search-for-prisoner', () => {
  it('should render search page', () => {
    return request(app)
      .get('/search-for-prisoner')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).not.toContain('id="search-results"')

        expect(prisonerSearchService.getPrisons).toHaveBeenCalledWith('user1')
        expect(prisonerSearchService.search).not.toHaveBeenCalled()
      })
  })

  it('should render page with no results', () => {
    prisonerSearchService.search.mockResolvedValue([])
    return request(app)
      .get('/search-for-prisoner-results?prisonNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).not.toContain('id="search-results"')
        expect(res.text).toContain('<span data-qa="result-count">0</span>')
      })
  })

  it('should render page with results', () => {
    prisonerSearchService.search.mockResolvedValue([
      { name: 'Norman Bates', prisonNumber: 'A1234AC', prison: 'HMP Leeds', bookingId: -3 },
      { name: 'Arthur Anderson', prisonNumber: 'A1234AA', prison: 'HMP Hull', bookingId: -1 },
      { name: 'Gillian Anderson', prisonNumber: 'A1234AB', prison: 'HMP Leeds', bookingId: -2 },
    ])

    return request(app)
      .get('/search-for-prisoner-results?prisonNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).toContain('id="search-results"')
        expect(res.text).toContain('<span data-qa="result-count">3</span>')
        expect(res.text).toContain('Norman Bates')

        expect(prisonerSearchService.getPrisons).toHaveBeenCalledWith('user1')
        expect(prisonerSearchService.search).toHaveBeenCalledWith('user1', {
          agencyId: undefined,
          firstName: undefined,
          lastName: undefined,
          prisonNumber: 'A1234AA',
        })
      })
  })

  it('should render validation messages', () => {
    return request(app)
      .get('/search-for-prisoner-results?prisonNumber=A12')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a prison number using 7 characters in the format A1234AA')
      })
  })
})

describe('POST /search-for-prisoner', () => {
  it('should redirect to search page with terms', () => {
    return request(app)
      .post('/search-for-prisoner')
      .send({ agencyId: 'MDI', prisonNumber: 'A1234AA', firstName: 'Brian', lastName: 'Jones' })
      .expect(
        'Location',
        '/search-for-prisoner-results?prisonNumber=A1234AA&firstName=Brian&lastName=Jones&agencyId=MDI'
      )
  })

  it('if terms are absent then they are not included', () => {
    return request(app)
      .post('/search-for-prisoner')
      .send({ agencyId: 'MDI', lastName: 'Jones' })
      .expect('Location', '/search-for-prisoner-results?lastName=Jones&agencyId=MDI')
  })
})
