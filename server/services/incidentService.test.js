const serviceCreator = require('./incidentService')

const formClient = {
  getFormDataForUser: jest.fn(),
  getIncidentsForUser: jest.fn(),
  deleteInvolvedStaff: jest.fn(),
  insertInvolvedStaff: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

let service

beforeEach(() => {
  const elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)

  service = serviceCreator({ formClient, elite2ClientBuilder })
  formClient.getFormDataForUser.mockReturnValue({ rows: [{ a: 'b' }, { c: 'd' }] })
  formClient.getIncidentsForUser.mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] })
  elite2Client.getOffenderDetails.mockReturnValue({ offenderNo: 'AA123ABC' })
})

afterEach(() => {
  formClient.getFormDataForUser.mockReset()
  formClient.update.mockReset()
  formClient.create.mockReset()
  formClient.getIncidentsForUser.mockReset()
  formClient.insertInvolvedStaff.mockReset()
  formClient.deleteInvolvedStaff.mockReset()
  elite2Client.getOffenderDetails.mockReset()
})

describe('getFormResponse', () => {
  test('it should call query on db', async () => {
    await service.getFormResponse('user1')
    expect(formClient.getFormDataForUser).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getFormResponse('user1')
    expect(output).toEqual({ a: 'b' })
  })
})

describe('getIncidentsForUser', () => {
  test('retrieve  details', async () => {
    const output = await service.getIncidentsForUser('user1', 'STATUS-1')

    expect(output).toEqual([{ id: 1 }, { id: 2 }])

    expect(formClient.getIncidentsForUser).toBeCalledTimes(1)
    expect(formClient.getIncidentsForUser).toBeCalledWith('user1', 'STATUS-1')
  })
})
describe('update', () => {
  test('should call update and pass in the form when form id is present', async () => {
    const updatedFormObject = {
      incidentDate: '21/12/2010',
      payload: { decision: 'Yes', followUp1: 'County', followUp2: 'Town' },
      involved: [{ name: 'Bob' }],
    }

    await service.update({
      bookingId: 1,
      userId: 'user1',
      formId: 'form1',
      updatedFormObject,
    })

    expect(formClient.update).toBeCalledTimes(1)
    expect(formClient.update).toBeCalledWith('form1', updatedFormObject.incidentDate, updatedFormObject.payload)
    expect(formClient.deleteInvolvedStaff).toBeCalledTimes(1)
    expect(formClient.deleteInvolvedStaff).toBeCalledWith('form1')
    expect(formClient.insertInvolvedStaff).toBeCalledTimes(1)
    expect(formClient.insertInvolvedStaff).toBeCalledWith('form1', [{ name: 'Bob' }])
  })

  test('updates if no-one is present', async () => {
    const updatedFormObject = {
      incidentDate: '21/12/2010',
      payload: { decision: 'Yes', followUp1: 'County', followUp2: 'Town' },
      involved: [],
    }

    await service.update({
      bookingId: 1,
      userId: 'user1',
      formId: 'form1',
      updatedFormObject,
    })

    expect(formClient.update).toBeCalledTimes(1)
    expect(formClient.update).toBeCalledWith('form1', updatedFormObject.incidentDate, updatedFormObject.payload)
    expect(formClient.deleteInvolvedStaff).toBeCalledTimes(1)
    expect(formClient.deleteInvolvedStaff).toBeCalledWith('form1')
    expect(formClient.insertInvolvedStaff).not.toBeCalled()
  })

  test('doesnt update involved staff if non-present', async () => {
    const updatedFormObject = {
      incidentDate: '21/12/2010',
      payload: { decision: 'Yes', followUp1: 'County', followUp2: 'Town' },
    }

    await service.update({
      bookingId: 1,
      userId: 'user1',
      formId: 'form1',
      updatedFormObject,
    })

    expect(formClient.update).toBeCalledTimes(1)
    expect(formClient.update).toBeCalledWith('form1', updatedFormObject.incidentDate, updatedFormObject.payload)
    expect(formClient.deleteInvolvedStaff).not.toBeCalled()
    expect(formClient.insertInvolvedStaff).not.toBeCalled()
  })

  test('should call create when form id not present', async () => {
    const updatedFormObject = { payload: { decision: 'Yes', followUp1: 'County', followUp2: 'Town' } }

    await service.update({
      bookingId: 1,
      userId: 'user1',
      reporterName: 'Bob Smith',
      updatedFormObject,
    })

    expect(formClient.create).toBeCalledTimes(1)
    expect(formClient.create).toBeCalledWith({
      userId: 'user1',
      bookingId: 1,
      offenderNo: 'AA123ABC',
      reporterName: 'Bob Smith',
      formResponse: updatedFormObject.payload,
    })
  })
})

describe('getValidationErrors', () => {
  const dependantConfig = {
    fields: [
      {
        q1: {
          responseType: 'requiredString',
          validationMessage: 'Please give a full name',
        },
      },
      {
        q2: {
          responseType: 'requiredYesNoIf_q1_Yes',
          validationMessage: 'Error q2',
        },
      },
    ],
  }

  test.each`
    formBody         | formConfig         | expectedOutput
    ${{ q1: 'Yes' }} | ${dependantConfig} | ${[{ href: '#q2', text: 'Error q2' }]}
    ${{ q1: 'No' }}  | ${dependantConfig} | ${[]}
  `('should return errors $expectedContent for form return', ({ formBody, formConfig, expectedOutput }) => {
    expect(service.getValidationErrors(formBody, formConfig)).toEqual(expectedOutput)
  })
})
