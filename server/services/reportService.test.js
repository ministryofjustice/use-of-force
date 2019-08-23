const serviceCreator = require('./reportService')

const incidentClient = {
  getCurrentDraftReport: jest.fn(),
  updateDraftReport: jest.fn(),
  createDraftReport: jest.fn(),
  submitReport: jest.fn(),
}

const involvedStaffService = {
  save: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' }

let service

beforeEach(() => {
  const elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)

  service = serviceCreator({ incidentClient, elite2ClientBuilder, involvedStaffService })
  incidentClient.getCurrentDraftReport.mockReturnValue({ id: 'form-1', a: 'b' })
  elite2Client.getOffenderDetails.mockReturnValue({ offenderNo: 'AA123ABC' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('submit', () => {
  test('it should save statements and submit the report', async () => {
    const result = await service.submit(currentUser, 'booking-1')

    expect(result).toEqual('form-1')
    expect(involvedStaffService.save).toBeCalledTimes(1)
    expect(involvedStaffService.save).toBeCalledWith('form-1', currentUser)

    expect(incidentClient.submitReport).toBeCalledTimes(1)
    expect(incidentClient.submitReport).toBeCalledWith(currentUser.username, 'booking-1')
  })
})

describe('getCurrentDraft', () => {
  test('it should call query on db', async () => {
    await service.getCurrentDraft('user1')
    expect(incidentClient.getCurrentDraftReport).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getCurrentDraft('user1')
    expect(output).toEqual({ id: 'form-1', a: 'b' })
  })
})

describe('update', () => {
  test('should call update and pass in the form when form id is present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }
    const involvedStaff = [{ name: 'Bob', username: 'BOB', email: 'bob@gov.uk' }]

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: '21/12/2010',
      involvedStaff,
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '21/12/2010', formObject)
  })

  test('should call createDraftReport when form id not present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formObject,
    })

    expect(incidentClient.createDraftReport).toBeCalledTimes(1)
    expect(incidentClient.createDraftReport).toBeCalledWith({
      userId: 'user1',
      bookingId: 1,
      offenderNo: 'AA123ABC',
      reporterName: 'Bob Smith',
      formResponse: formObject,
    })
  })
})
