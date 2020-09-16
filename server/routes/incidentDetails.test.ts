import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import types from '../config/types'
import { toDate } from '../utils/dateSanitiser'
import DraftReportService from '../services/report/draftReportService'
import { InvolvedStaffService } from '../services/involvedStaffService'
import { GetUsersResults } from '../types/uof'

jest.mock('../services/report/draftReportService')
jest.mock('../services/involvedStaffService')

const draftReportService = new DraftReportService(null, null, null) as jest.Mocked<DraftReportService>
const involvedStaffService = new InvolvedStaffService(null, null, null, null, null) as jest.Mocked<InvolvedStaffService>

const offenderService = {
  getOffenderDetails: jest.fn(),
}

const locationService = {
  getPrisonById: jest.fn(),
  getIncidentLocations: jest.fn().mockReturnValue([]),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, offenderService, involvedStaffService, locationService })
  draftReportService.getCurrentDraft.mockResolvedValue({})
  offenderService.getOffenderDetails.mockReturnValue({
    displayName: 'Bob Smith',
    offenderNo: '1234',
    agencyId: 'current-agency-id',
  })
  involvedStaffService.lookup.mockResolvedValue([])
  locationService.getIncidentLocations.mockResolvedValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /section/form', () => {
  test('should render Leeds prison', () => {
    locationService.getPrisonById.mockResolvedValue({
      description: 'Leeds prison',
    })
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
    involvedStaffService.lookup.mockResolvedValue([{ username: 'USER_BOB' } as GetUsersResults])

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
        involvedStaff: [{ username: 'User_bob' }, { username: '' }],
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/use-of-force-details')
      .expect(() => {
        expect(draftReportService.process).toBeCalledTimes(1)
        expect(draftReportService.process).toBeCalledWith(
          user,
          1,
          'incidentDetails',
          {
            locationId: -1,
            plannedUseOfForce: true,
            involvedStaff: [{ username: 'USER_BOB' }],
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
    involvedStaffService.lookup.mockResolvedValue([{ username: 'USER_BOB' } as GetUsersResults])

    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentDate: { date: '21/01/2019', time: { hour: '12', minute: '45' } },
        locationId: -1,
        plannedUseOfForce: 'true',
        involvedStaff: [{ username: 'User_bob' }, { username: '' }],
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
            involvedStaff: [{ username: 'USER_BOB' }],
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('successfully submit change prison', () => {
    involvedStaffService.lookup.mockResolvedValue([{ username: 'USER_BOB' } as GetUsersResults])

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
        involvedStaff: [{ username: 'User_bob' }, { username: '' }],
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
            involvedStaff: [{ username: 'USER_BOB' }],
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting partial update is allowed', () => {
    involvedStaffService.lookup.mockResolvedValue([{ username: 'USER_BOB' } as GetUsersResults])

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
            involvedStaff: [{ username: 'USER_BOB' }],
            locationId: -1,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting without incident date is allowed', () => {
    involvedStaffService.lookup.mockResolvedValue([{ username: 'USER_BOB' } as GetUsersResults])

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
            involvedStaff: [{ username: 'USER_BOB' }],
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
        involvedStaff: [{ username: '!@£$' }], // not a valid username
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', `/report/1/incident-details`))
})

describe('POST save and return to check-your-answers', () => {
  test('successfully submit valid update', () => {
    involvedStaffService.lookup.mockResolvedValue([{ username: 'USER_BOB' } as GetUsersResults])

    return request(app)
      .post(`/report/1/edit-incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: { date: '21/01/2019', time: { hour: '12', minute: '45' } },
        locationId: -1,
        plannedUseOfForce: 'true',
        involvedStaff: [{ username: 'User_bob' }, { username: '' }],
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
            involvedStaff: [{ username: 'USER_BOB' }],
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting invalid update is not allowed', () =>
    request(app)
      .post(`/report/1/edit-incident-details`)
      .send({
        submitType: 'save-and-continue',
        locationId: -1,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/edit-incident-details')
      .expect(() => {
        expect(draftReportService.process).not.toBeCalled()
      }))
})

describe('User name does not exists', () => {
  test('view when no missing users', () => {
    involvedStaffService.getDraftInvolvedStaff.mockResolvedValue([])
    return request(app)
      .get(`/report/1/username-does-not-exist`)
      .expect(302)
      .expect('Location', '/report/1/incident-details')
  })

  test('view when missing users', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })
    involvedStaffService.getDraftInvolvedStaff.mockResolvedValue([{ username: 'user-1', missing: true }])
    return request(app)
      .get(`/report/1/username-does-not-exist`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A username you have entered does not exist')
      })
  })

  test('submit and back to task list goes to report-use-of-force', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })

    return request(app)
      .post(`/report/1/username-does-not-exist`)
      .send({
        nextDestination: types.Destinations.TASKLIST,
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(involvedStaffService.removeMissingDraftInvolvedStaff).toBeCalledTimes(1)
        expect(involvedStaffService.removeMissingDraftInvolvedStaff).toBeCalledWith('user1', 1)
      })
  })

  test('submit and continue on goes to use-of-force-details', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })

    return request(app)
      .post(`/report/1/username-does-not-exist`)
      .send({
        nextDestination: types.Destinations.CONTINUE,
      })
      .expect(302)
      .expect('Location', '/report/1/use-of-force-details')
      .expect(() => {
        expect(involvedStaffService.removeMissingDraftInvolvedStaff).toBeCalledTimes(1)
        expect(involvedStaffService.removeMissingDraftInvolvedStaff).toBeCalledWith('user1', 1)
      })
  })

  test('submit and return to check-your-answers goes back to check-your-answers', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })

    return request(app)
      .post(`/report/1/username-does-not-exist`)
      .send({
        nextDestination: types.Destinations.CHECK_YOUR_ANSWERS,
      })
      .expect(302)
      .expect('Location', '/report/1/check-your-answers')
      .expect(() => {
        expect(involvedStaffService.removeMissingDraftInvolvedStaff).toBeCalledTimes(1)
        expect(involvedStaffService.removeMissingDraftInvolvedStaff).toBeCalledWith('user1', 1)
      })
  })
})

describe('Cancelling from edit', () => {
  test('Incident details - has no missing staff', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({
      id: 'form-1',
      form: { incidentDetails: { involvedStaff: [{ userId: 1, missing: false }] } },
    })
    return request(app)
      .get(`/report/1/cancel-edit/incidentDetails`)
      .expect(302)
      .expect('Location', '/report/1/check-your-answers')
  })
})

test('Incident details - has missing staff', () => {
  involvedStaffService.hasMissingDraftInvolvedStaff.mockResolvedValue(true)

  return request(app)
    .get(`/report/2/cancel-edit/incidentDetails`)
    .expect(302)
    .expect('Location', '/report/2/username-does-not-exist')
    .expect(() => {
      expect(involvedStaffService.hasMissingDraftInvolvedStaff).toHaveBeenCalledWith('user1', 2)
    })
})
