import UserService from './userService'
import { PrisonClient, ManageUsersApiClient } from '../data'
import { UserDetail, CaseLoad, Prison } from '../data/prisonClientTypes'
import { UserWithPrison } from '../types/uof'

const token = 'token-1'

jest.mock('../data')

const prisonClient = new PrisonClient() as jest.Mocked<PrisonClient>
const manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>

let service: UserService

beforeEach(() => {
  service = new UserService(manageUsersApiClient, prisonClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getSelf', () => {
  const user = {
    staffId: 3,
    username: 'jouser',
    firstName: 'Jo',
    lastName: 'Smith',
    activeCaseLoadId: '2',
  } as UserDetail

  it('should retrieve user details', async () => {
    prisonClient.getUser.mockResolvedValue(user)
    prisonClient.getUserCaseLoads.mockResolvedValue([
      { caseLoadId: '1', description: 'Moorland' } as CaseLoad,
      { caseLoadId: '2', description: 'Leeds' } as CaseLoad,
    ])

    const result = await service.getSelf(token)

    expect(result).toEqual({
      ...user,
      displayName: 'Jo Smith',
      displayNameInitial: 'J. Smith',
      activeCaseLoad: { caseLoadId: '2', description: 'Leeds' },
    })
  })

  it('should use the user token', async () => {
    prisonClient.getUser.mockResolvedValue(user)
    prisonClient.getUserCaseLoads.mockResolvedValue([
      { caseLoadId: '1', description: 'Moorland' } as CaseLoad,
      { caseLoadId: '2', description: 'Leeds' } as CaseLoad,
    ])

    await service.getSelf(token)

    expect(prisonClient.getUser).toBeCalledWith(token)
  })
})

describe('getUser', () => {
  it('Successfull', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }

    manageUsersApiClient.getEmail.mockResolvedValueOnce(user1)
    manageUsersApiClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123, activeCaseLoadId: 'MDI' })

    const result = await service.getUser(token, 'Bob')

    expect(result).toEqual({
      exists: true,
      username: 'Bob',
      name: 'Bob Smith',
      staffId: 123,
      email: 'an@email.com',
      verified: true,
      activeCaseLoadId: 'MDI',
    })
  })

  it('User not verified', async () => {
    const user1 = { username: 'BOB', exists: true, verified: false }

    manageUsersApiClient.getEmail.mockResolvedValueOnce(user1)
    manageUsersApiClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123, activeCaseLoadId: 'MDI' })

    const result = await service.getUser(token, 'Bob')

    expect(result).toEqual({
      exists: true,
      username: 'BOB',
      name: 'Bob Smith',
      staffId: 123,
      email: undefined,
      verified: false,
      activeCaseLoadId: 'MDI',
    })

    expect(manageUsersApiClient.getEmail).toHaveBeenCalledWith('BOB', token)
  })

  it('User not exists', async () => {
    const user1 = { username: 'BOB', exists: false, verified: false }

    manageUsersApiClient.getEmail.mockResolvedValueOnce(user1)
    manageUsersApiClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123, activeCaseLoadId: 'MDI' })

    const result = await service.getUser(token, 'Bob')

    expect(result).toEqual({
      exists: false,
      username: 'BOB',
      name: undefined,
      staffId: undefined,
      email: undefined,
      verified: false,
      activeCaseLoadId: undefined,
    })

    expect(manageUsersApiClient.getEmail).toHaveBeenCalledWith('BOB', token)
  })

  it('should use the user token', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }

    manageUsersApiClient.getEmail.mockResolvedValueOnce(user1)
    manageUsersApiClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith', staffId: 1, activeCaseLoadId: 'MDI' })

    await service.getUser(token, 'Bob')
  })
})

describe('findUsers', () => {
  it('All successfull', async () => {
    const user1 = {
      username: 'Bob',
      name: 'Bob Smith',
      email: 'an@email.com',
      exists: true,
      verified: true,
      staffId: 1,
      activeCaseLoadId: 'MDI',
    }

    manageUsersApiClient.findUsers.mockResolvedValue([user1])

    const result = await service.findUsers(token, 'Bob', 'Smith')

    expect(result).toEqual([user1])
  })
})

describe('findUsersWithPrisons', () => {
  it('All successfull', async () => {
    const user1 = {
      username: 'Bob',
      name: 'Bob Smith',
      email: 'an@email.com',
      exists: true,
      verified: true,
      staffId: 1,
      activeCaseLoadId: 'MDI',
    }

    manageUsersApiClient.findUsers.mockResolvedValue([user1])
    prisonClient.getPrisons.mockResolvedValue([{ agencyId: 'MDI', description: 'Moorland (HMP)' } as Prison])

    const result = await service.findUsersWithPrisons(token, 'MDI', 'Bob', 'Smith')

    expect(result).toEqual([{ ...user1, prison: 'Moorland (HMP)' }])
  })
})

describe('compareUsers', () => {
  const user = (username, caseLoad, prison): UserWithPrison => ({
    exists: true,
    username,
    name: 'Bob Smith',
    email: 'an@email.com',
    verified: true,
    staffId: 1,
    activeCaseLoadId: caseLoad,
    prison,
  })

  const results = (agency: string) => (users: UserWithPrison[]) =>
    users.sort(service.comparesUsers(agency)).map(u => u.username)

  it('active caseload first', async () => {
    const user1 = user('USER_1', 'MDI', 'Moorland')
    const user2 = user('USER_2', 'WWI', 'Whitemoor')

    expect(results('MDI')([user1, user2])).toEqual(['USER_1', 'USER_2'])
    expect(results('MDI')([user2, user1])).toEqual(['USER_1', 'USER_2'])
    expect(results('WWI')([user1, user2])).toEqual(['USER_2', 'USER_1'])
    expect(results('WWI')([user2, user1])).toEqual(['USER_2', 'USER_1'])
  })

  it('when not specific caseload, alphabetic by prison name ', async () => {
    const user1 = user('USER_1', 'AAA', 'aaa')
    const user2 = user('USER_2', 'BBB', 'bbb')

    expect(results('UNK')([user1, user2])).toEqual(['USER_1', 'USER_2'])
    expect(results('UNK')([user2, user1])).toEqual(['USER_1', 'USER_2'])
  })

  it('Missing caseload appear last', async () => {
    const user1 = user('USER_1', undefined, undefined)
    const user2 = user('USER_2', 'BBB', 'bbb')

    expect(results('UNK')([user1, user2])).toEqual(['USER_2', 'USER_1'])
    expect(results('UNK')([user2, user1])).toEqual(['USER_2', 'USER_1'])
  })

  it('when same caseload, alphabetic by username ', async () => {
    const user1 = user('USER_1', 'AAA', 'aaa')
    const user2 = user('USER_2', 'AAA', 'aaa')

    expect(results('UNK')([user1, user2])).toEqual(['USER_1', 'USER_2'])
    expect(results('UNK')([user2, user1])).toEqual(['USER_1', 'USER_2'])
  })
  describe('getUserLocation', () => {
    it('should return user location', async () => {
      const caseload = {
        agencyId: 'MDI',
        description: 'Moorland (HMP & YOI)',
        longDescription: 'some longer description',
        agencyType: 'INST',
        active: true,
      }

      manageUsersApiClient.getUser.mockResolvedValue({ name: 'Bob Smith', activeCaseLoadId: 'MDI', staffId: 485828 })
      prisonClient.getPrisonById.mockResolvedValue(caseload)
      const result = await service.getUserLocation(token, 'Bob Smith')
      expect(result).toEqual('Moorland (HMP & YOI)')
    })
  })
})
