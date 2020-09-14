import IncidentClient from '../../data/incidentClient'
import UpdateDraftReportService from './updateDraftReportService'

jest.mock('../../data/incidentClient')

const incidentClient = new IncidentClient(jest.fn as any, jest.fn() as any) as jest.Mocked<IncidentClient>

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' }

let service: UpdateDraftReportService
let elite2ClientBuilder

beforeEach(() => {
  elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)
  const systemToken = jest.fn().mockResolvedValue('system-token-1')
  service = new UpdateDraftReportService(incidentClient, elite2ClientBuilder, systemToken)
  incidentClient.getCurrentDraftReport.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
  elite2Client.getOffenderDetails.mockResolvedValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('updateAgencyId', () => {
  it('incidentClient.updateAgencyId should be called', async () => {
    await service.updateAgencyId('BXI', 'CA user', 1)
    expect(incidentClient.updateAgencyId).toBeCalledWith('BXI', 'CA user', 1)
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
      incidentDate: { value: '21/12/2010' },
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '21/12/2010', formObject)
  })

  test('doesnt call update if neither form or incident present', async () => {
    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject: null,
      incidentDate: { value: null },
    })

    expect(incidentClient.updateDraftReport).not.toBeCalled()
  })

  test('Still call update if form is present but incident date isnt', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: { value: null },
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', null, formObject)
  })

  test('Still call update if incident date is present but form object isnt', async () => {
    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject: {},
      incidentDate: { value: '09/08/2019' },
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '09/08/2019', null)
  })
})

describe('create', () => {
  test('should call createDraftReport when form id not present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formObject,
      formId: null,
      incidentDate: { value: '2/2/2019' },
    })

    expect(incidentClient.createDraftReport).toBeCalledTimes(1)
    expect(incidentClient.createDraftReport).toBeCalledWith({
      userId: 'user1',
      bookingId: 1,
      agencyId: 'MDI',
      offenderNo: 'AA123ABC',
      reporterName: 'Bob Smith',
      formResponse: formObject,
      incidentDate: '2/2/2019',
    })
    expect(elite2ClientBuilder).toHaveBeenCalledWith('system-token-1')
  })
})
