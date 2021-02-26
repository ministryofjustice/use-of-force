import DraftReportClient from '../../data/draftReportClient'
import { LoggedInUser } from '../../types/uof'
import UpdateDraftReportService from './updateDraftReportService'

jest.mock('../../data/draftReportClient')

const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' } as LoggedInUser
const incidentDate = new Date()

let service: UpdateDraftReportService
let elite2ClientBuilder

beforeEach(() => {
  elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)
  const systemToken = jest.fn().mockResolvedValue('system-token-1')
  service = new UpdateDraftReportService(draftReportClient, elite2ClientBuilder, systemToken)
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
  elite2Client.getOffenderDetails.mockResolvedValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('updateAgencyId', () => {
  it('draftReportClient.updateAgencyId should be called', async () => {
    await service.updateAgencyId('BXI', 'CA user', 1)
    expect(draftReportClient.updateAgencyId).toBeCalledWith('BXI', 'CA user', 1)
  })
})

describe('update', () => {
  test('should call update and pass in the form when form id is present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.process(currentUser, 1, 'form', formObject, incidentDate)

    expect(draftReportClient.update).toBeCalledTimes(1)
    expect(draftReportClient.update).toBeCalledWith(1, incidentDate, { form: formObject })
  })

  test('doesnt call update if neither form or incident present', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })

    await service.process(currentUser, 1, 'incidentDetails', {})

    expect(draftReportClient.update).not.toBeCalled()
  })

  test('Still call update if form is present but incident date isnt', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.process(currentUser, 1, 'form', formObject)

    expect(draftReportClient.update).toBeCalledTimes(1)
    expect(draftReportClient.update).toBeCalledWith(1, undefined, { form: formObject })
  })

  test('Still call update if incident date is present but form object isnt', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })

    await service.process(currentUser, 1, 'incidentDetails', {}, incidentDate)

    expect(draftReportClient.update).toBeCalledWith(1, incidentDate, null)
  })

  test('Still call update if incident date is present when form object isnt', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: {} })

    await service.process(currentUser, 1, 'incidentDetails', {}, incidentDate)

    expect(draftReportClient.update).toBeCalledWith(1, incidentDate, { incidentDetails: {} })
  })
})

describe('create', () => {
  test('should call create when form id not present', async () => {
    draftReportClient.get.mockResolvedValue({ id: null, form: {} })

    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.process(currentUser, 1, 'form', formObject, incidentDate)

    expect(draftReportClient.create).toBeCalledTimes(1)
    expect(draftReportClient.create).toBeCalledWith({
      userId: 'user1',
      bookingId: 1,
      agencyId: 'MDI',
      offenderNo: 'AA123ABC',
      reporterName: 'Bob Smith',
      formResponse: { form: formObject },
      incidentDate,
    })
    expect(elite2ClientBuilder).toHaveBeenCalledWith('system-token-1')
  })
})
