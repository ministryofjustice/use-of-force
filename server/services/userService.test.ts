import UserService from './userService'
import { Elite2Client } from '../data/elite2ClientBuilder'
import { UserDetail, CaseLoad } from '../data/elite2ClientBuilderTypes'
import { AuthClient } from '../data/authClientBuilder'

const token = 'token-1'

jest.mock('../data/elite2ClientBuilder')
jest.mock('../data/authClientBuilder')

const elite2Client = new Elite2Client(null) as jest.Mocked<Elite2Client>
const authClient = new AuthClient(null) as jest.Mocked<AuthClient>

const elite2ClientBuilder = jest.fn()
const authClientBuilder = jest.fn()

let service: UserService

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  authClientBuilder.mockReturnValue(authClient)

  service = new UserService(elite2ClientBuilder, authClientBuilder)
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
    elite2Client.getUser.mockResolvedValue(user)
    elite2Client.getUserCaseLoads.mockResolvedValue([
      { caseLoadId: '1', description: 'Moorland' } as CaseLoad,
      { caseLoadId: '2', description: 'Leeds' } as CaseLoad,
    ])

    const result = await service.getUser(token)

    expect(result).toEqual({
      ...user,
      displayName: 'Jo Smith',
      activeCaseLoad: { caseLoadId: '2', description: 'Leeds' },
    })
  })

  it('should use the user token', async () => {
    elite2Client.getUser.mockResolvedValue(user)
    elite2Client.getUserCaseLoads.mockResolvedValue([
      { caseLoadId: '1', description: 'Moorland' } as CaseLoad,
      { caseLoadId: '2', description: 'Leeds' } as CaseLoad,
    ])

    await service.getUser(token)

    expect(elite2ClientBuilder).toBeCalledWith(token)
  })
})

describe('getUsers', () => {
  it('All successfull', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'June', email: 'bn@email.com', exists: true, verified: true }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)
    authClient.getUser
      .mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123 })
      .mockResolvedValueOnce({ name: 'June Jones', staffId: 234 })

    const result = await service.getUsers(token, ['Bob', 'June'])

    expect(result).toEqual([
      {
        username: 'Bob',
        name: 'Bob Smith',
        staffId: 123,
        email: 'an@email.com',
        verified: true,
      },
      {
        username: 'June',
        name: 'June Jones',
        staffId: 234,
        email: 'bn@email.com',
        verified: true,
      },
    ])
  })

  it('One not verified', async () => {
    const user1 = { username: 'BOB', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'JUNE', exists: true, verified: false }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)
    authClient.getUser
      .mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123 })
      .mockResolvedValueOnce({ name: 'June Jones', staffId: 234 })

    const result = await service.getUsers(token, ['Bob', 'June'])

    expect(result).toEqual([
      {
        username: 'BOB',
        name: 'Bob Smith',
        staffId: 123,
        email: 'an@email.com',
        verified: true,
      },
      {
        username: 'JUNE',
        name: 'June Jones',
        staffId: 234,
        email: undefined,
        verified: false,
      },
    ])

    expect(authClient.getEmail.mock.calls).toEqual([['BOB'], ['JUNE']])
  })

  it('should use the user token', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }

    authClient.getEmail.mockResolvedValueOnce(user1)
    authClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith', staffId: 1 })

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
    }

    authClient.findUsers.mockResolvedValue([user1])

    const result = await service.findUsers(token, 'Bob', 'Smith')

    expect(result).toEqual([user1])
  })
})
