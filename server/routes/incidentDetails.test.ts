import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import { toDate } from '../utils/dateSanitiser'
import DraftReportService from '../services/drafts/draftReportService'
import OffenderService from '../services/offenderService'
import LocationService from '../services/locationService'
import type { Prison } from '../data/elite2ClientBuilderTypes'

jest.mock('../services/drafts/draftReportService')
jest.mock('../services/offenderService')
jest.mock('../services/locationService')

const draftReportService = new DraftReportService(null, null, null, null, null, null) as jest.Mocked<DraftReportService>
const offenderService = new OffenderService(null) as jest.Mocked<OffenderService>
const locationService = new LocationService(null) as jest.Mocked<LocationService>

let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, offenderService, locationService })
  draftReportService.getCurrentDraft.mockResolvedValue({})
  offenderService.getOffenderDetails.mockResolvedValue({
    displayName: 'Bob Smith',
    offenderNo: '1234',
    agencyId: 'current-agency-id',
  })
  locationService.getIncidentLocations.mockResolvedValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /section/form', () => {
  test('should render Leeds prison', () => {
    locationService.getPrisonById.mockResolvedValue({
      agencyId: 'LEI',
      description: 'Leeds prison',
    } as Prison)
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Leeds prison')
      })
  })

  test('should render incident-details for existing report using system creds', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1' })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(offenderService.getOffenderDetails).toBeCalledWith('user1-system-token', '1')
      })
  })
  test('should render incident-details using locations for current agency if new report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({})
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(locationService.getIncidentLocations).toBeCalledWith('user1-system-token', 'current-agency-id')
      })
  })
  test('should render incident-details using locations for persisted agency if existing report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1', agencyId: 'persisted-agency-id' })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(locationService.getIncidentLocations).toBeCalledWith('user1-system-token', 'persisted-agency-id')
      })
  })
})

describe('POST save and continue /section/form', () => {
  test('should redirect to next page', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: {
          date: '21/01/2019',
          time: { hour: '12', minute: '45' },
        },
        locationId: -1,
        plannedUseOfForce: 'true',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/staff-involved')
      .expect(() => {
        expect(draftReportService.process).toBeCalledTimes(1)
        expect(draftReportService.process).toBeCalledWith(
          user,
          1,
          'incidentDetails',
          {
            locationId: -1,
            plannedUseOfForce: true,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting invalid update is not allowed and user redirected to same page', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: {
          date: '21/01/2019',
          time: { hour: '12', minute: '45' },
        },
        locationId: -1,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/incident-details')
      .expect(() => {
        expect(draftReportService.process).not.toBeCalled()
      }))
})

describe('POST save and return to tasklist', () => {
  test('successfully submit valid update', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentDate: { date: '21/01/2019', time: { hour: '12', minute: '45' } },
        locationId: -1,
        plannedUseOfForce: 'true',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(draftReportService.process).toBeCalledTimes(1)
        expect(draftReportService.process).toBeCalledWith(
          user,
          1,
          'incidentDetails',
          {
            locationId: -1,
            plannedUseOfForce: true,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('successfully submit change prison', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-change-prison',
        incidentDate: {
          date: '21/01/2019',
          time: { hour: '12', minute: '45' },
        },
        locationId: -1,
        plannedUseOfForce: 'true',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/change-prison')
      .expect(() => {
        expect(draftReportService.process).toBeCalledTimes(1)
        expect(draftReportService.process).toBeCalledWith(
          user,
          1,
          'incidentDetails',
          {
            locationId: -1,
            plannedUseOfForce: true,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting partial update is allowed', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentDate: {
          date: '21/01/2019',
          time: { hour: '12', minute: '45' },
        },
        locationId: -1,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(draftReportService.process).toBeCalledTimes(1)
        expect(draftReportService.process).toBeCalledWith(
          user,
          1,
          'incidentDetails',
          {
            locationId: -1,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting without incident date is allowed', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        locationId: -1,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(draftReportService.process).toBeCalledTimes(1)
        expect(draftReportService.process).toBeCalledWith(
          user,
          1,
          'incidentDetails',
          {
            locationId: -1,
            witnesses: [{ name: 'User bob' }],
          },
          null
        )
      })
  })

  test('Submitting bad data is rejected', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentDate: {
          date: '21/01/2019',
          time: { hour: '12', minute: '45' },
        },
        witnesses: [{ name: '$% bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', `/report/1/incident-details`))
})

describe('POST save and return to check-your-answers', () => {
  test('aa successfully submit valid update', () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: { date: '21/01/2019', time: { hour: '12', minute: '45' } },
        locationId: -1,
        plannedUseOfForce: 'true',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/check-your-answers')
      .expect(() => {
        expect(draftReportService.process).toBeCalledTimes(1)
        expect(draftReportService.process).toBeCalledWith(
          user,
          1,
          'incidentDetails',
          {
            locationId: -1,
            plannedUseOfForce: true,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting invalid update is not allowed', () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        locationId: -1,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/incident-details')
      .expect(() => {
        expect(draftReportService.process).not.toBeCalled()
      })
  })
})
