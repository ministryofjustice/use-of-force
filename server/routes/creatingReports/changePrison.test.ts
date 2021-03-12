import request from 'supertest'
import { Prison } from '../../data/prisonClientTypes'
import { LocationService, DraftReportService } from '../../services'
import { appWithAllRoutes } from '../__test/appSetup'

jest.mock('../../services')

const locationService = new LocationService(null) as jest.Mocked<LocationService>
const draftReportService = new DraftReportService(null, null, null, null, null, null) as jest.Mocked<DraftReportService>

let app

beforeEach(() => {
  app = appWithAllRoutes({ locationService, draftReportService })
  locationService.getPrisons.mockResolvedValue([
    {
      agencyId: 'BXI',
      description: 'Brixton',
    } as Prison,
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /change-prison', () => {
  test('should render content', () => {
    return request(app)
      .get(`/report/-19/change-prison`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('What prison did the use of force take place in?')
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
        expect(draftReportService.updateAgencyId).toHaveBeenCalledWith('MDI', 'user1', '-19')
      })
  })

  it('Cancel should not call the location service', () => {
    return request(app)
      .post('/report/-19/change-prison')
      .send({ agencyId: 'MDI', submit: 'cancel' })
      .expect(302)
      .expect(() => {
        expect(draftReportService.updateAgencyId).not.toHaveBeenCalled()
      })
  })
})
