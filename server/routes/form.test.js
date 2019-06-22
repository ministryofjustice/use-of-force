const request = require('supertest')
const appSetup = require('./testutils/appSetup')
const createRouter = require('./form')
const { authenticationMiddleware } = require('./testutils/mockAuthentication')
const incidentConfig = require('../config/incident')
const tConfig = require('../config/transport')
const aConfig = require('../config/agile')

const formConfig = {
  ...incidentConfig,
  ...tConfig,
  ...aConfig,
}

const formService = {
  getFormResponse: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
}

const nomisService = {
  getOffenderDetails: jest.fn().mockReturnValue({ displayName: 'Bob Smith', offenderNo: '1234' }),
}

const formRoute = createRouter({ formService, authenticationMiddleware, nomisService })

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
    ${'incident/newIncident'} | ${'Full name'}
    ${'incident/dob'}         | ${'What is your date of birth?'}
    ${'incident/address'}     | ${'What is your address?'}
    ${'transport/commute'}    | ${'How do you commute to work?'}
    ${'transport/car'}        | ${'Do you own a car?'}
    ${'agile/experience'}     | ${'Have you worked with agile methodologies before?'}
    ${'agile/opinion'}        | ${'Can you provide your opinions on agile working?'}
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
    sectionName    | formName         | userInput                        | nextPath
    ${'incident'}  | ${'newIncident'} | ${{ fullName: 'Name' }}          | ${'/form/incident/dob/'}
    ${'incident'}  | ${'dob'}         | ${{ day: '12' }}                 | ${'/form/incident/address/'}
    ${'incident'}  | ${'address'}     | ${{ addressLine1: 'Something' }} | ${'/tasklist/'}
    ${'transport'} | ${'commute'}     | ${{ commuteVia: 'a' }}           | ${'/form/transport/car/'}
    ${'transport'} | ${'car'}         | ${{ haveCar: 'no' }}             | ${'/tasklist/'}
    ${'agile'}     | ${'experience'}  | ${{ workedPreviously: 'No' }}    | ${'/tasklist/'}
    ${'agile'}     | ${'experience'}  | ${{ workedPreviously: 'Yes' }}   | ${'/form/agile/opinion/'}
    ${'agile'}     | ${'opinion'}     | ${{ response: 'Stuff' }}         | ${'/tasklist/'}
  `('should render $expectedContent for $sectionName/$formName', ({ sectionName, formName, userInput, nextPath }) =>
    request(app)
      .post(`/${sectionName}/${formName}/1`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}1`)
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        expect(formService.update).toBeCalledWith({
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

  test('should not update the licence if the input is invalid', () => {
    formService.getValidationErrors.mockReturnValue({ some: 'thing' })

    return request(app)
      .post(`/incident/newIncident/1`)
      .send({ user: 'input' })
      .expect(302)
      .expect('Location', '/form/incident/newIncident/1')
      .expect(() => {
        expect(formService.update).toBeCalledTimes(0)
      })
  })
})
