import DraftReportClient from '../../data/draftReportClient'
import DraftReportService from './draftReportService'

jest.mock('../../data/draftReportClient')
jest.mock('../offenderService')
jest.mock('../involvedStaffService')

const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>

let service: DraftReportService

beforeEach(() => {
  service = new DraftReportService(draftReportClient, null, null)
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getCurrentDraft', () => {
  test('it should call query on db', async () => {
    await service.getCurrentDraft('user1', 1)
    expect(draftReportClient.get).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getCurrentDraft('user1', 1)
    expect(output).toEqual({ id: 1, a: 'b', incidentDate: 'today' })
  })
})
