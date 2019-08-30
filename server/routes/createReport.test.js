const request = require('supertest')
const moment = require('moment')
const { appSetup, user } = require('./testutils/appSetup')
const createRouter = require('./index')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')

const reportService = {
  getCurrentDraft: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  getUpdatedFormObject: jest.fn(),
}

const offenderService = {
  getOffenderDetails: jest.fn().mockReturnValue({ displayName: 'Bob Smith', offenderNo: '1234', locations: [] }),
}

const involvedStaffService = {
  get: () => [],
  lookup: () => [],
}

const formRoute = createRouter({ reportService, authenticationMiddleware, offenderService, involvedStaffService })

let app

beforeEach(() => {
  app = appSetup(formRoute)
  reportService.getCurrentDraft.mockResolvedValue({})
  reportService.getUpdatedFormObject.mockResolvedValue({})
})

afterEach(() => {
  reportService.getCurrentDraft.mockReset()
  reportService.getUpdatedFormObject.mockReset({})
  reportService.update.mockReset()
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
              involvedStaff: [{ username: 'User bob' }],
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
              involvedStaff: [{ username: 'User bob' }],
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
