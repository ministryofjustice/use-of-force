import IncidentClient from '../../data/incidentClient'
import DraftReportService from './draftReportService'

jest.mock('../../data/incidentClient')
jest.mock('../offenderService')
jest.mock('../involvedStaffService')

const incidentClient = new IncidentClient(jest.fn as any, jest.fn() as any) as jest.Mocked<IncidentClient>

let service: DraftReportService

beforeEach(() => {
  service = new DraftReportService(incidentClient, null, null)
  incidentClient.getCurrentDraftReport.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getCurrentDraft', () => {
  test('it should call query on db', async () => {
    await service.getCurrentDraft('user1', 1)
    expect(incidentClient.getCurrentDraftReport).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getCurrentDraft('user1', 1)
    expect(output).toEqual({ id: 1, a: 'b', incidentDate: 'today' })
  })
})
