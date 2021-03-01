import { DraftReportClient, PrisonClient, AuthClient } from '../../data'
import { FoundUserResult } from '../../types/uof'
import { UserService } from '..'
import { DraftInvolvedStaffService } from './draftInvolvedStaffService'

jest.mock('../')
jest.mock('../../data')

const prisonClient = new PrisonClient(null) as jest.Mocked<PrisonClient>
const authClient = new AuthClient(null) as jest.Mocked<AuthClient>
const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>
const userService = new UserService(null, null) as jest.Mocked<UserService>

let service: DraftInvolvedStaffService

const aUser = (username: string, activeCaseLoadId: string, staffId: number) =>
  ({ username, activeCaseLoadId, staffId } as FoundUserResult)

beforeEach(() => {
  const prisonClientBuilder = jest.fn().mockReturnValue(prisonClient)
  const authClientBuilder = jest.fn().mockReturnValue(authClient)

  service = new DraftInvolvedStaffService(authClientBuilder, prisonClientBuilder, draftReportClient, userService)
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getInvolvedStaff', () => {
  test('getInvolvedStaff when user exists on report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-1' }, { username: 'user-2' }])
    userService.getUsers.mockResolvedValue([aUser('user-1', 'MDI', 1)])

    await expect(service.getInvolvedStaff('token-1', 'user-1', 1)).resolves.toStrictEqual([
      { username: 'user-1', isReporter: true, activeCaseLoadId: 'MDI', staffId: 1 },
      { username: 'user-2' },
    ])

    expect(userService.getUsers).toBeCalledWith('token-1', ['user-1'])
  })

  test('getInvolvedStaff when user does not exist on report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])
    userService.getUsers.mockResolvedValue([aUser('user-1', 'MDI', 1)])

    await expect(service.getInvolvedStaff('token-1', 'user-1', 1)).resolves.toStrictEqual([
      { username: 'user-1', isReporter: true, activeCaseLoadId: 'MDI', staffId: 1 },
      { username: 'user-2' },
    ])

    expect(userService.getUsers).toBeCalledWith('token-1', ['user-1'])
  })
})

describe('getInvolvedStaffWithPrisons', () => {
  const aUserResult = (name: string, activeCaseLoadId: string, staffId: number) => ({ name, activeCaseLoadId, staffId })

  test('getInvolvedStaff when user exists on report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([
      { username: 'user-1', staffId: 1 },
      { username: 'user-2', staffId: 2 },
    ])
    authClient.getUsers.mockResolvedValue([aUserResult('user-1', 'MDI', 1), aUserResult('user-2', 'MDI', 2)])
    userService.getUsers.mockResolvedValue([aUser('user-1', 'MDI', 1), aUser('user-2', 'MDI', 2)])
    prisonClient.getPrisons.mockResolvedValue([
      { agencyId: 'MDI', description: 'Moorland (HMP)', active: true, agencyType: 'INST' },
    ])

    await expect(service.getInvolvedStaffWithPrisons('token-1', 'user-1', 1)).resolves.toStrictEqual([
      { username: 'user-1', isReporter: true, activeCaseLoadId: 'MDI', prison: 'Moorland (HMP)', staffId: 1 },
      { username: 'user-2', prison: 'Moorland (HMP)', staffId: 2 },
    ])

    expect(userService.getUsers).toBeCalledWith('token-1', ['user-1'])
  })
})
