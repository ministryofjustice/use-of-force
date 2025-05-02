import { PrisonClient, DraftReportClient, IncidentClient } from '../../data'
import { InmateDetail } from '../../data/prisonClientTypes'
import ReportLogClient from '../../data/reportLogClient'
import { LoggedInUser } from '../../types/uof'
import UpdateDraftReportService from './updateDraftReportService'
import AuthService from '../authService'
import PrisonerSearchService from '../prisonerSearchService'
import { PrisonerSearchApiPrisoner } from '../../types/prisonerSearchApi/prisonerSearchTypes'

jest.mock('../../data')
jest.mock('../authService')
jest.mock('../prisonerSearchService')

const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>
const incidentClient = new IncidentClient(null, null, null) as jest.Mocked<IncidentClient>
const prisonClient = new PrisonClient() as jest.Mocked<PrisonClient>
const reportLogClient = new ReportLogClient() as jest.Mocked<ReportLogClient>
const authService = new AuthService(null) as jest.Mocked<AuthService>

const currentUser = { username: 'user1', displayName: 'Bob Smith' } as LoggedInUser
const incidentDate = new Date()
const transactionalClient = jest.fn()
const inTransaction = callback => callback(transactionalClient)

let service: UpdateDraftReportService

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue('system-token-1')
  service = new UpdateDraftReportService(
    draftReportClient,
    incidentClient,
    reportLogClient,
    inTransaction,
    prisonClient,
    authService
  )
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
  prisonClient.getOffenderDetails.mockResolvedValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' } as InmateDetail)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('updateAgencyId', () => {
  it('draftReportClient.updateAgencyId should be called', async () => {
    await service.updateAgencyId('BXI', 'CA user', '1')
    expect(draftReportClient.updateAgencyId).toHaveBeenCalledWith('BXI', 'CA user', '1')
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

    await service.process(currentUser, '1', 'form', formObject, incidentDate)

    expect(incidentClient.update).toHaveBeenCalledTimes(1)
    expect(incidentClient.update).toHaveBeenCalledWith('1', incidentDate, { form: formObject })
  })

  test('doesnt call update if neither form or incident present', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })

    await service.process(currentUser, '1', 'incidentDetails', {})

    expect(incidentClient.update).not.toHaveBeenCalled()
  })

  test('Still call update if form is present but incident date isnt', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.process(currentUser, '1', 'form', formObject)

    expect(incidentClient.update).toHaveBeenCalledTimes(1)
    expect(incidentClient.update).toHaveBeenCalledWith('1', undefined, { form: formObject })
  })

  test('Still call update if incident date is present but form object isnt', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: { incidentDetails: {} } })

    await service.process(currentUser, '1', 'incidentDetails', {}, incidentDate)

    expect(incidentClient.update).toHaveBeenCalledWith('1', incidentDate, null)
  })

  test('Still call update if incident date is present when form object isnt', async () => {
    draftReportClient.get.mockResolvedValue({ id: 1, form: {} })

    await service.process(currentUser, '1', 'incidentDetails', {}, incidentDate)

    expect(incidentClient.update).toHaveBeenCalledWith('1', incidentDate, { incidentDetails: {} })
  })
})

describe('create', () => {
  test('should call create when form id not present', async () => {
    draftReportClient.get.mockResolvedValue({ id: null, form: {} })

    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.process(currentUser, '1', 'form', formObject, incidentDate)

    expect(draftReportClient.create).toHaveBeenCalledTimes(1)
    expect(draftReportClient.create).toHaveBeenCalledWith({
      userId: 'user1',
      bookingId: '1',
      agencyId: 'MDI',
      offenderNo: 'AA123ABC',
      reporterName: 'Bob Smith',
      formResponse: { form: formObject },
      incidentDate,
    })
  })
})
