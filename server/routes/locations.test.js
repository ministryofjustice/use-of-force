const request = require('supertest')
const { appWithAllRoutes } = require('./testutils/appSetup')

const locationService = {
  getActiveAgenciesByType: jest.fn(),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ locationService })
  locationService.getActiveAgenciesByType.mockResolvedValue([])
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

  test('should contain the Continue and Cancel buttons', () => {
    return request(app)
      .get(`/report/-19/change-prison`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Continue')
        expect(res.text).toContain('Cancel')
      })
  })
})
