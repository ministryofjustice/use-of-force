import request from 'supertest'
import { Prison } from '../../data/prisonClientTypes'
import { appWithAllRoutes } from '../__test/appSetup'
import LocationService from '../../services/locationService'
import DraftReportService from '../../services/drafts/draftReportService'
import AuthService from '../../services/authService'

jest.mock('../../services/drafts/draftReportService')
jest.mock('../../services/authService')
jest.mock('../../services/locationService')

const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<DraftReportService>
const authService = new AuthService(null) as jest.Mocked<AuthService>

let app
const flash = jest.fn()

beforeEach(() => {
  flash.mockReturnValue([])
  app = appWithAllRoutes({ locationService, draftReportService, authService }, undefined, false, flash)
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

describe('GET /prison-of-incident', () => {
  test('should render content', () => {
    return request(app)
      .get(`/report/-19/prison-of-incident`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('What prison did the use of force take place in?')
        expect(res.text).toContain('Brixton')
      })
  })
})
describe('POST /prison-of-incident', () => {
  it('should redirect to incident-details page', () => {
    return request(app)
      .post('/report/-19/prison-of-incident')
      .send({ agencyId: 'MDI', submit: 'save-and-continue' })
      .expect(302)
      .expect('Location', '/report/-19/incident-details')
  })

  it('Not selecting a prison but selecting Continue should redirect to current page', () => {
    return request(app)
      .post('/report/-19/prison-of-incident')
      .send({ submit: 'save-and-continue' })
      .expect(302)
      .expect('Location', '/report/-19/prison-of-incident')
  })

  it('Selecting a prison followed by Continue should call the location service', () => {
    return request(app)
      .post('/report/-19/prison-of-incident')
      .send({ agencyId: 'MDI', submit: 'save-and-continue' })
      .expect(302)
      .expect(() => {
        expect(draftReportService.updateAgencyId).toHaveBeenCalledWith('MDI', 'user1', -19)
      })
  })

  it('Cancel should not call the location service', () => {
    return request(app)
      .post('/report/-19/prison-of-incident')
      .send({ agencyId: 'MDI', submit: 'cancel' })
      .expect(302)
      .expect(() => {
        expect(draftReportService.updateAgencyId).not.toHaveBeenCalled()
      })
  })

  it('Should process user input', () => {
    flash.mockReturnValue([{ plannedUseOfForce: true, authorisedBy: 'the authoriser' }])

    return request(app)
      .post('/report/-19/prison-of-incident')
      .send({ agencyId: 'MDI', submit: 'save-and-continue' })
      .expect(302)
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledWith(
          {
            activeCaseLoadId: 'MDI',
            displayName: 'First Last',
            firstName: 'first',
            isReviewer: false,
            lastName: 'last',
            token: 'token',
            userId: 'id',
            username: 'user1',
          },
          -19,
          'incidentDetails',
          { authorisedBy: 'the authoriser', plannedUseOfForce: true, witnesses: undefined },
          null
        )
        expect(draftReportService.updateAgencyId).toHaveBeenCalledWith('MDI', 'user1', -19)
        expect(flash).toHaveBeenCalledTimes(1)
      })
  })
})
