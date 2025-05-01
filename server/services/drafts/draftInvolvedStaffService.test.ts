import { DraftReportClient, PrisonClient, ManageUsersApiClient } from '../../data'
import { FoundUserResult } from '../../types/uof'
import { DraftInvolvedStaffService } from './draftInvolvedStaffService'
import UserService from '../userService'

jest.mock('../userService')
jest.mock('../../data')

const prisonClient = new PrisonClient() as jest.Mocked<PrisonClient>
const manageUsersClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>
const userService = new UserService(null, null) as jest.Mocked<UserService>

let service: DraftInvolvedStaffService

const aUser = (username: string, activeCaseLoadId: string, staffId: number) =>
  ({ username, activeCaseLoadId, staffId, exists: true } as FoundUserResult)

beforeEach(() => {
  service = new DraftInvolvedStaffService(manageUsersClient, prisonClient, draftReportClient, userService)
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getInvolvedStaff', () => {
  test('User can add another staff member to report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])
    userService.getUser.mockResolvedValue(aUser('user-1', 'MDI', 1))

    await expect(service.getInvolvedStaff('token-1', 'user-1', 1)).resolves.toStrictEqual([
      { username: 'user-1', isReporter: true, exists: true, activeCaseLoadId: 'MDI', staffId: 1 },
      { username: 'user-2' },
    ])

    expect(userService.getUser).toBeCalledWith('token-1', 'user-1')
  })
})

describe('getInvolvedStaffWithPrisons', () => {
  const aUserResult = (name: string, activeCaseLoadId: string, staffId: number) => ({
    name,
    activeCaseLoadId,
    staffId,
  })

  test('getInvolvedStaffWithPrisons', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2', staffId: 2 }])
    manageUsersClient.getUsers.mockResolvedValue([aUserResult('user-1', 'MDI', 1), aUserResult('user-2', 'MDI', 2)])
    userService.getUser.mockResolvedValue(aUser('user-1', 'MDI', 1))
    prisonClient.getPrisons.mockResolvedValue([
      { agencyId: 'MDI', description: 'Moorland (HMP)', active: true, agencyType: 'INST' },
    ])

    await expect(service.getInvolvedStaffWithPrisons('token-1', 'user-1', 1)).resolves.toStrictEqual([
      {
        username: 'user-1',
        isReporter: true,
        exists: true,
        activeCaseLoadId: 'MDI',
        prison: 'Moorland (HMP)',
        staffId: 1,
      },
      { username: 'user-2', prison: 'Moorland (HMP)', staffId: 2 },
    ])

    expect(userService.getUser).toBeCalledWith('token-1', 'user-1')
  })
})
