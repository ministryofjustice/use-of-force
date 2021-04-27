import UserService from './userService'
import { PrisonClient, AuthClient } from '../data'
import { UserDetail, CaseLoad, Prison } from '../data/prisonClientTypes'
import { UserWithPrison } from '../types/uof'

const token = 'token-1'

jest.mock('../data')

const prisonClient = new PrisonClient(null) as jest.Mocked<PrisonClient>
const authClient = new AuthClient(null) as jest.Mocked<AuthClient>

const prisonClientBuilder = jest.fn()
const authClientBuilder = jest.fn()

let service: UserService

beforeEach(() => {
  prisonClientBuilder.mockReturnValue(prisonClient)
  authClientBuilder.mockReturnValue(authClient)

  service = new UserService(prisonClientBuilder, authClientBuilder)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getUser', () => {
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

    const result = await service.getUser(token)

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

    await service.getUser(token)

    expect(prisonClientBuilder).toBeCalledWith(token)
  })
})

describe('getUsers', () => {
  it('All successfull', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'June', email: 'bn@email.com', exists: true, verified: true }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)
    authClient.getUser
      .mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123, activeCaseLoadId: 'MDI' })
      .mockResolvedValueOnce({ name: 'June Jones', staffId: 234, activeCaseLoadId: 'MDI' })

    const result = await service.getUsers(token, ['Bob', 'June'])

    expect(result).toEqual([
      {
        username: 'Bob',
        name: 'Bob Smith',
        staffId: 123,
        email: 'an@email.com',
        verified: true,
        activeCaseLoadId: 'MDI',
      },
      {
        username: 'June',
        name: 'June Jones',
        staffId: 234,
        email: 'bn@email.com',
        verified: true,
        activeCaseLoadId: 'MDI',
      },
    ])
  })

  it('One not verified', async () => {
    const user1 = { username: 'BOB', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'JUNE', exists: true, verified: false }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)
    authClient.getUser
      .mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123, activeCaseLoadId: 'MDI' })
      .mockResolvedValueOnce({ name: 'June Jones', staffId: 234, activeCaseLoadId: 'MDI' })

    const result = await service.getUsers(token, ['Bob', 'June'])

    expect(result).toEqual([
      {
        username: 'BOB',
        name: 'Bob Smith',
        staffId: 123,
        email: 'an@email.com',
        verified: true,
        activeCaseLoadId: 'MDI',
      },
      {
        username: 'JUNE',
        name: 'June Jones',
        staffId: 234,
        email: undefined,
        verified: false,
        activeCaseLoadId: 'MDI',
      },
    ])

    expect(authClient.getEmail.mock.calls).toEqual([['BOB'], ['JUNE']])
  })

  it('should use the user token', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }

    authClient.getEmail.mockResolvedValueOnce(user1)
    authClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith', staffId: 1, activeCaseLoadId: 'MDI' })

    await service.getUsers(token, ['Bob'])

    expect(authClientBuilder).toBeCalledWith(token)
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

    authClient.findUsers.mockResolvedValue([user1])

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

    authClient.findUsers.mockResolvedValue([user1])
    prisonClient.getPrisons.mockResolvedValue([{ agencyId: 'MDI', description: 'Moorland (HMP)' } as Prison])

    const result = await service.findUsersWithPrisons(token, 'MDI', 'Bob', 'Smith')

    expect(result).toEqual([{ ...user1, prison: 'Moorland (HMP)' }])
  })
})

describe('compareUsers', () => {
  const user = (username, caseLoad, prison): UserWithPrison => ({
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

      authClient.getUser.mockResolvedValue({ name: 'Bob Smith', activeCaseLoadId: 'MDI', staffId: 485828 })
      prisonClient.getPrisonById.mockResolvedValue(caseload)
      const result = await service.getUserLocation(token, 'Bob Smith')
      expect(result).toEqual('Moorland (HMP & YOI)')
    })
  })
})
