const serviceCreator = require('./reportService')

const incidentClient = {
  getCurrentDraftReport: jest.fn(),
  updateDraftReport: jest.fn(),
  createDraftReport: jest.fn(),
}

const involvedStaffService = {
  update: jest.fn(),
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
  incidentClient.getCurrentDraftReport.mockReturnValue({ a: 'b' })
  elite2Client.getOffenderDetails.mockReturnValue({ offenderNo: 'AA123ABC' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getCurrentDraft', () => {
  test('it should call query on db', async () => {
    await service.getCurrentDraft('user1')
    expect(incidentClient.getCurrentDraftReport).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getCurrentDraft('user1')
    expect(output).toEqual({ a: 'b' })
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
    expect(involvedStaffService.update).toBeCalledTimes(1)
    expect(involvedStaffService.update).toBeCalledWith('form1', involvedStaff)
  })

  test('removes involved staff, if no-one is present in involved staff', async () => {
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

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '21/12/2010', formObject)
    expect(involvedStaffService.update).toBeCalledTimes(1)
    expect(involvedStaffService.update).toBeCalledWith('form1', [])
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

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '21/12/2010', formObject)
    expect(involvedStaffService.update).not.toBeCalled()
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
