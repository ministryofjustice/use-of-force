const request = require('supertest')
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
  test.each`
    userInput                          | nextPath
    ${{ submit: 'save-and-continue' }} | ${'/report/1/use-of-force-details'}
  `('should render', ({ userInput, nextPath }) =>
    request(app)
      .post(`/report/1/incident-details`)
      .send(userInput)
      .expect(302)
      .expect('Location', nextPath)
      .expect(() => {
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          formObject: { incident: { incidentDetails: {} } },
        })
      })
  )
})

describe('POST save and return to tasklist', () => {
  test.each`
    userInput                        | nextPath
    ${{ submit: 'save-and-return' }} | ${'/report/1/report-use-of-force'}
  `('should render', ({ userInput, nextPath }) =>
    request(app)
      .post(`/report/1/incident-details`)
      .send(userInput)
      .expect(302)
      .expect('Location', nextPath)
      .expect(() => {
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          formObject: { incident: { incidentDetails: {} } },
        })
      })
  )
})
