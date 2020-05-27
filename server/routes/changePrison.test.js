const request = require('supertest')
const { appWithAllRoutes } = require('./testutils/appSetup')

const locationService = {
  getPrisons: jest.fn(),
}
const reportService = {
  updateAgencyId: jest.fn(),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ locationService, reportService })
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
describe('POST /change-prison', () => {
  it('should redirect to incident-details page', () => {
    return request(app)
      .post('/report/-19/change-prison')
      .send({ agencyId: 'MDI', submit: 'save-and-continue' })
      .expect(302)
      .expect('Location', '/report/-19/incident-details')
  })

  it('Not selecting a prison but selecting Continue should redirect to current page', () => {
    return request(app)
      .post('/report/-19/change-prison')
      .send({ submit: 'save-and-continue' })
      .expect(302)
      .expect('Location', '/report/-19/change-prison')
  })

  it('Selecting a prison followed by Continue should call the location service', () => {
    return request(app)
      .post('/report/-19/change-prison')
      .send({ agencyId: 'MDI', submit: 'save-and-continue' })
      .expect(302)
      .expect(() => {
        expect(reportService.updateAgencyId).toHaveBeenCalledWith('MDI', 'user1', '-19')
      })
  })

  it('Cancel should not call the location service', () => {
    return request(app)
      .post('/report/-19/change-prison')
      .send({ agencyId: 'MDI', submit: 'cancel' })
      .expect(302)
      .expect(() => {
        expect(reportService.updateAgencyId).not.toHaveBeenCalled()
      })
  })
})
