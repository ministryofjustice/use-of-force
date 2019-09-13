const request = require('supertest')
const moment = require('moment')
const { appSetup, user } = require('./testutils/appSetup')
const createRouter = require('./index')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')
const types = require('../config/types')

const reportService = {
  getCurrentDraft: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  getUpdatedFormObject: jest.fn(),
  isDraftComplete: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn().mockReturnValue({ displayName: 'Bob Smith', offenderNo: '1234', locations: [] }),
}

const involvedStaffService = {
  lookup: () => [],
  removeMissingDraftInvolvedStaff: jest.fn(),
  getDraftInvolvedStaff: jest.fn(),
}

const formRoute = createRouter({ reportService, authenticationMiddleware, offenderService, involvedStaffService })

let app

beforeEach(() => {
  app = appSetup(formRoute)
  reportService.getCurrentDraft.mockResolvedValue({})
  reportService.getUpdatedFormObject.mockResolvedValue({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /section/form', () => {
  test.each`
    expectedContent
    ${'Prisoner'}
  `('should render $expectedContent for $path', ({ expectedContent }) =>
    request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )
})

describe('POST save and continue /section/form', () => {
  test('should redirect to next page', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submit: 'save-and-continue',
        incidentDate: '2019-08-27T13:59:33+01:00',
        locationId: -1,
        plannedUseOfForce: 'true',
        involvedStaff: [{ username: 'User bob' }, { username: '' }],
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
          incidentDate: moment('2019-08-27T13:59:33+01:00').toDate(),
          formObject: {
            incidentDetails: {
              locationId: -1,
              plannedUseOfForce: true,
              involvedStaff: [{ username: 'USER BOB' }],
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
      }))

  test('Submitting invalid update is not allowed and user redirected to same page', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submit: 'save-and-continue',
        incidentDate: '2019-08-27T13:59:33+01:00',
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
  test('successfully submit valid update', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submit: 'save-and-return',
        incidentDate: '2019-08-27T13:59:33+01:00',
        locationId: -1,
        plannedUseOfForce: 'true',
        involvedStaff: [{ username: 'User bob' }, { username: '' }],
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
          incidentDate: moment('2019-08-27T13:59:33+01:00').toDate(),
          formObject: {
            incidentDetails: {
              locationId: -1,
              plannedUseOfForce: true,
              involvedStaff: [{ username: 'USER BOB' }],
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
      }))

  test('Submitting invalid update is allowed', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submit: 'save-and-return',
        incidentDate: '2019-08-27T13:59:33+01:00',
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
          incidentDate: moment('2019-08-27T13:59:33+01:00').toDate(),
          formObject: {
            incidentDetails: {
              locationId: -1,
              witnesses: [{ name: 'User bob' }],
            },
          },
        })
      }))
})

describe('Submitting evidence page', () => {
  test.each`
    submitType             | formComplete | nextPath
    ${'save-and-return'}   | ${true}      | ${'/report/1/report-use-of-force'}
    ${'save-and-return'}   | ${false}     | ${'/report/1/report-use-of-force'}
    ${'save-and-continue'} | ${true}      | ${'/report/1/check-your-answers'}
    ${'save-and-continue'} | ${false}     | ${'/report/1/report-use-of-force'}
  `(
    'should redirect to $nextPath for when submit type is $submitType and form is complete: $formComplete',
    ({ submitType, formComplete, nextPath }) => {
      reportService.isDraftComplete.mockReturnValue(formComplete)
      return request(app)
        .post(`/report/1/evidence`)
        .send({
          submit: submitType,
          baggedEvidence: 'true',
          bodyWornCamera: 'YES',
          bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
          cctvRecording: 'YES',
          evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
          photographsTaken: 'true',
        })
        .expect(302)
        .expect('Location', nextPath)
        .expect(() => {
          expect(reportService.update).toBeCalledTimes(1)
          expect(reportService.update).toBeCalledWith({
            currentUser: user,
            bookingId: 1,
            formId: undefined,
            formObject: {
              evidence: {
                baggedEvidence: true,
                bodyWornCamera: 'YES',
                bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
                cctvRecording: 'YES',
                evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
                photographsTaken: true,
              },
            },
          })
        })
    }
  )
})

describe('User name does not exists', () => {
  test('view when no missing users', async () => {
    return request(app)
      .get(`/report/1/username-does-not-exist`)
      .expect(302)
      .expect('Location', '/report/1/incident-details')
  })

  test('view when missing users', async () => {
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

  test('submit and back to task list', async () => {
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

  test('submit and back to task list', async () => {
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
})
