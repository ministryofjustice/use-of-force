const serviceCreator = require('./incidentService')

const incidentClient = {
  getCurrentDraftIncident: jest.fn(),
  getIncidentsForUser: jest.fn(),
  getStatement: jest.fn(),
  getInvolvedStaff: jest.fn(),
  deleteInvolvedStaff: jest.fn(),
  insertInvolvedStaff: jest.fn(),
  updateDraftIncident: jest.fn(),
  createDraftIncident: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

let service

beforeEach(() => {
  const elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)

  service = serviceCreator({ incidentClient, elite2ClientBuilder })
  incidentClient.getCurrentDraftIncident.mockReturnValue({ a: 'b' })
  incidentClient.getIncidentsForUser.mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] })
  elite2Client.getOffenderDetails.mockReturnValue({ offenderNo: 'AA123ABC' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getCurrentDraftIncident', () => {
  test('it should call query on db', async () => {
    await service.getCurrentDraftIncident('user1')
    expect(incidentClient.getCurrentDraftIncident).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getCurrentDraftIncident('user1')
    expect(output).toEqual({ a: 'b' })
  })
})

describe('getInvolvedStaff', () => {
  test('it should call query on db', async () => {
    await service.getInvolvedStaff('incident-1')
    expect(incidentClient.getInvolvedStaff).toBeCalledTimes(1)
  })
})

describe('getIncidentsForUser', () => {
  test('retrieve  details', async () => {
    const output = await service.getIncidentsForUser('user1', 'STATUS-1')

    expect(output).toEqual([{ id: 1 }, { id: 2 }])

    expect(incidentClient.getIncidentsForUser).toBeCalledTimes(1)
    expect(incidentClient.getIncidentsForUser).toBeCalledWith('user1', 'STATUS-1')
  })
})

describe('getIncidentWithStatement', () => {
  test('retrieve details when user is involved', async () => {
    const incident = { id: 1, user_id: 'BOB' }

    incidentClient.getStatement.mockReturnValue(incident)

    const output = await service.getStatement('BOB', 1)

    expect(output).toEqual(incident)

    expect(incidentClient.getStatement).toBeCalledWith('BOB', 1)
  })

  test('retrieve details when incident is not present', async () => {
    incidentClient.getStatement.mockReturnValue(undefined)

    await expect(service.getStatement('BOB', 1)).rejects.toThrow(new Error("Incident: '1' does not exist"))

    expect(incidentClient.getStatement).toBeCalledWith('BOB', 1)
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

    expect(incidentClient.updateDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.updateDraftIncident).toBeCalledWith(
      'form1',
      updatedFormObject.incidentDate,
      updatedFormObject.payload
    )
    expect(incidentClient.deleteInvolvedStaff).toBeCalledTimes(1)
    expect(incidentClient.deleteInvolvedStaff).toBeCalledWith('form1')
    expect(incidentClient.insertInvolvedStaff).toBeCalledTimes(1)
    expect(incidentClient.insertInvolvedStaff).toBeCalledWith('form1', [{ userId: 'Bob', name: 'Bob' }])
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

    expect(incidentClient.updateDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.updateDraftIncident).toBeCalledWith(
      'form1',
      updatedFormObject.incidentDate,
      updatedFormObject.payload
    )
    expect(incidentClient.deleteInvolvedStaff).toBeCalledTimes(1)
    expect(incidentClient.deleteInvolvedStaff).toBeCalledWith('form1')
    expect(incidentClient.insertInvolvedStaff).not.toBeCalled()
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

    expect(incidentClient.updateDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.updateDraftIncident).toBeCalledWith(
      'form1',
      updatedFormObject.incidentDate,
      updatedFormObject.payload
    )
    expect(incidentClient.deleteInvolvedStaff).not.toBeCalled()
    expect(incidentClient.insertInvolvedStaff).not.toBeCalled()
  })

  test('should call createDraftIncident when form id not present', async () => {
    const updatedFormObject = { payload: { decision: 'Yes', followUp1: 'County', followUp2: 'Town' } }

    await service.update({
      bookingId: 1,
      userId: 'user1',
      reporterName: 'Bob Smith',
      updatedFormObject,
    })

    expect(incidentClient.createDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.createDraftIncident).toBeCalledWith({
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
    formBody                    | formConfig         | expectedOutput
    ${{ q1: 'Yes', q3: 'Yes' }} | ${dependantConfig} | ${{ errors: [{ href: '#q2', text: 'Error q2' }], formResponse: { q1: 'Yes' } }}
    ${{ q1: 'No', q3: 'Yes' }}  | ${dependantConfig} | ${{ errors: [], formResponse: { q1: 'No' } }}
  `('should return errors $expectedContent for form return', ({ formBody, formConfig, expectedOutput }) => {
    expect(service.getValidationErrors(formBody, formConfig.fields)).toEqual(expectedOutput)
  })
})
