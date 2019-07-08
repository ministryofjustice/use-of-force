const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./form')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')
const incidentConfig = require('../config/incident')

const formConfig = {
  ...incidentConfig,
}

const formService = {
  getFormResponse: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
}

const offenderService = {
  getOffenderDetails: jest.fn().mockReturnValue({ displayName: 'Bob Smith', offenderNo: '1234', locations: [] }),
}

const formRoute = createRouter({ formService, authenticationMiddleware, offenderService })

let app

beforeEach(() => {
  app = appSetup(formRoute)
  formService.getFormResponse.mockResolvedValue({})
})

afterEach(() => {
  formService.getFormResponse.mockReset()
  formService.update.mockReset()
})

describe('GET /section/form', () => {
  test.each`
    path                      | expectedContent
    ${'incident/newIncident'} | ${'Prisoner involved'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )
})

describe('POST /section/form', () => {
  test.each`
    sectionName   | formName         | userInput | nextPath
    ${'incident'} | ${'newIncident'} | ${{}}     | ${'/form/incident/details/'}
  `('should render $expectedContent for $sectionName/$formName', ({ sectionName, formName, userInput, nextPath }) =>
    request(app)
      .post(`/${sectionName}/${formName}/1`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}1`)
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        expect(formService.update).toBeCalledWith({
          bookingId: 1,
          userId: 'user1',
          formId: undefined,
          formObject: {},
          config: formConfig[formName],
          userInput,
          formSection: sectionName,
          formName,
        })
      })
  )
})
