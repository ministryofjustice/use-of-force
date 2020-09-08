const request = require('supertest')
const { appWithAllRoutes, user } = require('./testutils/appSetup')
const types = require('../config/types')
const { toDate } = require('../utils/dateSanitiser')

const reportService = {
  getCurrentDraft: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  getUpdatedFormObject: jest.fn(),
  isDraftComplete: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn(),
}

const locationService = {
  getPrisonById: jest.fn(),
  getIncidentLocations: jest.fn().mockReturnValue([]),
}

const involvedStaffService = {
  lookup: async () => [],
  removeMissingDraftInvolvedStaff: jest.fn(),
  getDraftInvolvedStaff: jest.fn(),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ reportService, offenderService, involvedStaffService, locationService })
  reportService.getCurrentDraft.mockResolvedValue({})
  reportService.getUpdatedFormObject.mockResolvedValue({})
  offenderService.getOffenderDetails.mockReturnValue({
    displayName: 'Bob Smith',
    offenderNo: '1234',
    agencyId: 'current-agency-id',
  })((involvedStaffService.lookup = async () => []))
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
    reportService.getCurrentDraft.mockResolvedValue({ id: '1' })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(offenderService.getOffenderDetails).toBeCalledWith('user1-system-token', '1')
      })
  })
  test('should render incident-details using locations for current agency if new report', () => {
    reportService.getCurrentDraft.mockResolvedValue({})
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(locationService.getIncidentLocations).toBeCalledWith('user1-system-token', 'current-agency-id')
      })
  })
  test('should render incident-details using locations for persisted agency if existing report', () => {
    reportService.getCurrentDraft.mockResolvedValue({ id: '1', agencyId: 'persisted-agency-id' })
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
    involvedStaffService.lookup = async () => [{ username: 'USER_BOB' }]

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
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          incidentDate: toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }),
          formObject: {
            incidentDetails: {
              locationId: -1,
              plannedUseOfForce: true,
              involvedStaff: [{ username: 'USER_BOB' }],
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
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
        expect(reportService.update).not.toBeCalled()
      }))
})

describe('POST save and return to tasklist', () => {
  test('successfully submit valid update', () => {
    involvedStaffService.lookup = async () => [{ username: 'USER_BOB' }]

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
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          incidentDate: toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }),
          formObject: {
            incidentDetails: {
              locationId: -1,
              plannedUseOfForce: true,
              involvedStaff: [{ username: 'USER_BOB' }],
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
      })
  })

  test('successfully submit change prison', () => {
    involvedStaffService.lookup = async () => [{ username: 'USER_BOB' }]

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
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          incidentDate: toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }),
          formObject: {
            incidentDetails: {
              locationId: -1,
              plannedUseOfForce: true,
              involvedStaff: [{ username: 'USER_BOB' }],
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
      })
  })

  test('Submitting invalid update is allowed', () => {
    involvedStaffService.lookup = async () => [{ username: 'USER_BOB' }]

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
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          incidentDate: toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }),
          formObject: {
            incidentDetails: {
              involvedStaff: [{ username: 'USER_BOB' }],
              locationId: -1,
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
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
    involvedStaffService.lookup = async () => [{ username: 'USER_BOB' }]

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
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          incidentDate: toDate({ date: '21/01/2019', time: { hour: '12', minute: '45' } }),
          formObject: {
            incidentDetails: {
              locationId: -1,
              plannedUseOfForce: true,
              involvedStaff: [{ username: 'USER_BOB' }],
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
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
        expect(reportService.update).not.toBeCalled()
      }))
})

describe('User name does not exists', () => {
  test('view when no missing users', () =>
    request(app).get(`/report/1/username-does-not-exist`).expect(302).expect('Location', '/report/1/incident-details'))

  test('view when missing users', () => {
    reportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })
    involvedStaffService.getDraftInvolvedStaff.mockResolvedValue([{ userId: 1, missing: true }])
    return request(app)
      .get(`/report/1/username-does-not-exist`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A username you have entered does not exist')
      })
  })

  test('submit and back to task list goes to report-use-of-force', () => {
    reportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })

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
    reportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })

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
    reportService.getCurrentDraft.mockResolvedValue({ id: 'form-1' })

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
    reportService.getCurrentDraft.mockResolvedValue({
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
  reportService.getCurrentDraft.mockResolvedValue({
    id: 'form-1',
    form: { incidentDetails: { involvedStaff: [{ userId: 1, missing: true }] } },
  })
  return request(app)
    .get(`/report/1/cancel-edit/incidentDetails`)
    .expect(302)
    .expect('Location', '/report/1/username-does-not-exist')
})