import { RestClientBuilder, PrisonClient, DraftReportClient, IncidentClient } from '../../data'
import { InmateDetail } from '../../data/prisonClientTypes'
import ReportLogClient from '../../data/reportLogClient'
import { LoggedInUser } from '../../types/uof'
import UpdateDraftReportService from './updateDraftReportService'

jest.mock('../../data')

const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>
const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>
const prisonClient = new PrisonClient(null) as jest.Mocked<PrisonClient>
const reportLogClient = new ReportLogClient() as jest.Mocked<ReportLogClient>

const currentUser = { username: 'user1', displayName: 'Bob Smith' } as LoggedInUser
const incidentDate = new Date()
const transactionalClient = jest.fn()
const inTransaction = callback => callback(transactionalClient)

let service: UpdateDraftReportService
let prisonClientBuilder: RestClientBuilder<PrisonClient>

beforeEach(() => {
  prisonClientBuilder = jest.fn().mockReturnValue(prisonClient)
  const systemToken = jest.fn().mockResolvedValue('system-token-1')
  service = new UpdateDraftReportService(
    draftReportClient,
    incidentClient,
    reportLogClient,
    inTransaction,
    prisonClientBuilder,
    systemToken
  )
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
  prisonClient.getOffenderDetails.mockResolvedValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' } as InmateDetail)
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

describe('updateLocationId', () => {
  it('incidentClient.update should be called', async () => {
    await service.updateLocationId(1, incidentDate, {})
    expect(incidentClient.update).toHaveBeenCalledWith(1, incidentDate, {})
  })
})

describe('update', () => {
  test('should call update and pass in the form when form id is present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.process(currentUser, 1, 'form', formObject, incidentDate)

    expect(incidentClient.update).toBeCalledTimes(1)
    expect(incidentClient.update).toBeCalledWith(1, incidentDate, { form: formObject })
  })

  test('doesnt call update if neither form or incident present', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })

    await service.process(currentUser, 1, 'incidentDetails', {})

    expect(incidentClient.update).not.toBeCalled()
  })

  test('Still call update if form is present but incident date isnt', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.process(currentUser, 1, 'form', formObject)

    expect(incidentClient.update).toBeCalledTimes(1)
    expect(incidentClient.update).toBeCalledWith(1, undefined, { form: formObject })
  })

  test('Still call update if incident date is present but form object isnt', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })

    await service.process(currentUser, 1, 'incidentDetails', {}, incidentDate)

    expect(incidentClient.update).toBeCalledWith(1, incidentDate, null)
  })

  test('Still call update if incident date is present when form object isnt', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: {} })

    await service.process(currentUser, 1, 'incidentDetails', {}, incidentDate)

    expect(incidentClient.update).toBeCalledWith(1, incidentDate, { incidentDetails: {} })
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
    expect(prisonClientBuilder).toHaveBeenCalledWith('system-token-1')
  })
})
