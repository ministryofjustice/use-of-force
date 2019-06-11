const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/form')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const pdConfig = require('../../server/config/personalDetails')
const tConfig = require('../../server/config/transport')
const aConfig = require('../../server/config/agile')

const formConfig = {
  ...pdConfig,
  ...tConfig,
  ...aConfig,
}

const formService = {
  getFormResponse: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
}

const formRoute = createRouter({ formService, authenticationMiddleware })

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
    path                         | expectedContent
    ${'personalDetails/name'}    | ${'Full name'}
    ${'personalDetails/dob'}     | ${'What is your date of birth?'}
    ${'personalDetails/address'} | ${'What is your address?'}
    ${'transport/commute'}       | ${'How do you commute to work?'}
    ${'transport/car'}           | ${'Do you own a car?'}
    ${'agile/experience'}        | ${'Have you worked with agile methodologies before?'}
    ${'agile/opinion'}           | ${'Can you provide your opinions on agile working?'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )
})

describe('POST /section/form', () => {
  test.each`
    sectionName          | formName        | userInput                        | nextPath
    ${'personalDetails'} | ${'name'}       | ${{ fullName: 'Name' }}          | ${'/form/personalDetails/dob/'}
    ${'personalDetails'} | ${'dob'}        | ${{ day: '12' }}                 | ${'/form/personalDetails/address/'}
    ${'personalDetails'} | ${'address'}    | ${{ addressLine1: 'Something' }} | ${'/tasklist'}
    ${'transport'}       | ${'commute'}    | ${{ commuteVia: 'a' }}           | ${'/form/transport/car/'}
    ${'transport'}       | ${'car'}        | ${{ haveCar: 'no' }}             | ${'/tasklist'}
    ${'agile'}           | ${'experience'} | ${{ workedPreviously: 'No' }}    | ${'/tasklist'}
    ${'agile'}           | ${'experience'} | ${{ workedPreviously: 'Yes' }}   | ${'/form/agile/opinion'}
    ${'agile'}           | ${'opinion'}    | ${{ response: 'Stuff' }}         | ${'/tasklist'}
  `('should render $expectedContent for $sectionName/$formName', ({ sectionName, formName, userInput, nextPath }) =>
    request(app)
      .post(`/${sectionName}/${formName}`)
      .send(userInput)
      .expect(302)
      .expect('Location', nextPath)
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
      .post(`/personalDetails/name`)
      .send({ user: 'input' })
      .expect(302)
      .expect('Location', '/form/personalDetails/name/')
      .expect(() => {
        expect(formService.update).toBeCalledTimes(0)
      })
  })
})
