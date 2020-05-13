const request = require('supertest')
const { appWithAllRoutes } = require('./testutils/appSetup')

const locationService = {
  getPrisons: jest.fn(),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ locationService })
  locationService.getPrisons.mockResolvedValue([
    {
      agencyId: 'BXI',
      description: 'Brixton',
    },
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /change-prison', () => {
  test('should display page title', () => {
    return request(app)
      .get(`/report/-19/change-prison`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('What prison did the use of force take place in?')
      })
  })

  test('should contain Brixton as one of the options in the select', () => {
    return request(app)
      .get(`/report/-19/change-prison`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Brixton')
      })
  })
})
