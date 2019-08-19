const serviceCreator = require('./incidentService')
const { StatementStatus } = require('../config/types')

const incidentClient = {
  getCurrentDraftIncident: jest.fn(),
  getStatementsForUser: jest.fn(),
  getStatement: jest.fn(),
  saveStatement: jest.fn(),
  submitStatement: jest.fn(),
  getInvolvedStaff: jest.fn(),
  deleteInvolvedStaff: jest.fn(),
  insertInvolvedStaff: jest.fn(),
  updateDraftIncident: jest.fn(),
  createDraftIncident: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' }

let service

beforeEach(() => {
  const elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)

  service = serviceCreator({ incidentClient, elite2ClientBuilder })
  incidentClient.getCurrentDraftIncident.mockReturnValue({ a: 'b' })
  incidentClient.getStatementsForUser.mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] })
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

describe('getStatementsForUser', () => {
  test('retrieve  details', async () => {
    const output = await service.getStatementsForUser('user1', StatementStatus.PENDING)

    expect(output).toEqual([{ id: 1 }, { id: 2 }])

    expect(incidentClient.getStatementsForUser).toBeCalledTimes(1)
    expect(incidentClient.getStatementsForUser).toBeCalledWith('user1', StatementStatus.PENDING)
  })
})

describe('getStatement', () => {
  test('retrieve details when user is involved', async () => {
    const incident = { id: 1, user_id: 'BOB' }

    incidentClient.getStatement.mockReturnValue(incident)

    const output = await service.getStatement('BOB', 1, StatementStatus.PENDING)

    expect(output).toEqual(incident)

    expect(incidentClient.getStatement).toBeCalledWith('BOB', 1, StatementStatus.PENDING)
  })

  test('retrieve details when incident is not present', async () => {
    incidentClient.getStatement.mockReturnValue(undefined)

    await expect(service.getStatement('BOB', 1, 'PENDING')).rejects.toThrow(new Error("Incident: '1' does not exist"))

    expect(incidentClient.getStatement).toBeCalledWith('BOB', 1, 'PENDING')
  })
})

describe('update', () => {
  test('should call update and pass in the form when form id is present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: '21/12/2010',
      involvedStaff: [{ name: 'Bob', username: 'BOB', email: 'bob@gov.uk' }],
    })

    expect(incidentClient.updateDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.updateDraftIncident).toBeCalledWith('form1', '21/12/2010', formObject)
    expect(incidentClient.deleteInvolvedStaff).toBeCalledTimes(1)
    expect(incidentClient.deleteInvolvedStaff).toBeCalledWith('form1')
    expect(incidentClient.insertInvolvedStaff).toBeCalledTimes(1)
    expect(incidentClient.insertInvolvedStaff).toBeCalledWith('form1', [
      { userId: 'BOB', name: 'Bob', email: 'bob@gov.uk' },
    ])
  })

  test('updates if no-one is present', async () => {
    const formObject = {
      decision: 'Yes',
      followUp1: 'County',
      followUp2: 'Town',
    }

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      involvedStaff: [],
      incidentDate: '21/12/2010',
    })

    expect(incidentClient.updateDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.updateDraftIncident).toBeCalledWith('form1', '21/12/2010', formObject)
    expect(incidentClient.deleteInvolvedStaff).toBeCalledTimes(1)
    expect(incidentClient.deleteInvolvedStaff).toBeCalledWith('form1')
    expect(incidentClient.insertInvolvedStaff).not.toBeCalled()
  })

  test('doesnt update involved staff if non-present', async () => {
    const formObject = {
      decision: 'Yes',
      followUp1: 'County',
      followUp2: 'Town',
    }

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: '21/12/2010',
    })

    expect(incidentClient.updateDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.updateDraftIncident).toBeCalledWith('form1', '21/12/2010', formObject)
    expect(incidentClient.deleteInvolvedStaff).not.toBeCalled()
    expect(incidentClient.insertInvolvedStaff).not.toBeCalled()
  })

  test('should call createDraftIncident when form id not present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formObject,
    })

    expect(incidentClient.createDraftIncident).toBeCalledTimes(1)
    expect(incidentClient.createDraftIncident).toBeCalledWith({
      userId: 'user1',
      bookingId: 1,
      offenderNo: 'AA123ABC',
      reporterName: 'Bob Smith',
      formResponse: formObject,
    })
  })

  test('should call saveStatement', async () => {
    const statement = {}

    await service.saveStatement('user1', 'incident-1', statement)

    expect(incidentClient.saveStatement).toBeCalledTimes(1)
    expect(incidentClient.saveStatement).toBeCalledWith('user1', 'incident-1', statement)
  })

  test('should call submitStatement', async () => {
    await service.submitStatement('user1', 'incident-1')

    expect(incidentClient.submitStatement).toBeCalledTimes(1)
    expect(incidentClient.submitStatement).toBeCalledWith('user1', 'incident-1')
  })
})

describe('validateSavedStatement', () => {
  test('valid statement', async () => {
    incidentClient.getStatement.mockReturnValue({
      lastTrainingMonth: 1,
      lastTrainingYear: 2000,
      jobStartYear: 1998,
      statement: 'A statement',
    })

    const errors = await service.validateSavedStatement('user-1', 1)
    expect(errors).toEqual([])
  })

  test('can cope with additional attributes', async () => {
    incidentClient.getStatement.mockReturnValue({
      lastTrainingMonth: 1,
      lastTrainingYear: 2000,
      jobStartYear: 1998,
      statement: 'A statement',
      id: 1223,
      bookingId: 'bookingId',
    })

    const errors = await service.validateSavedStatement('user-1', 1)
    expect(errors).toEqual([])
  })

  test('invalid statement', async () => {
    incidentClient.getStatement.mockReturnValue({})

    const errors = await service.validateSavedStatement('user-1', 1)
    expect(errors.map(error => error.href)).toEqual([
      '#lastTrainingMonth',
      '#lastTrainingYear',
      '#jobStartYear',
      '#statement',
    ])
  })
})
