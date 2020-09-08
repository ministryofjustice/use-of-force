import UserService from './userService'
import { Elite2Client } from '../data/elite2ClientBuilder'
import { UserDetail, CaseLoad } from '../data/elite2ClientBuilderTypes'

const token = 'token-1'

jest.mock('../data/elite2ClientBuilder')

const elite2Client = new Elite2Client(jest.fn as any) as jest.Mocked<Elite2Client>

const authClient = {
  getEmail: jest.fn(),
  getUser: jest.fn(),
}

const elite2ClientBuilder = jest.fn()
const authClientBuilder = jest.fn()

let service

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

    await service.getUser(token, -5)

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
        missing: false,
        verified: true,
      },
      {
        username: 'June',
        name: 'June Jones',
        staffId: 234,
        email: 'bn@email.com',
        missing: false,
        verified: true,
      },
    ])
  })

  it('One non existent', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'June', exists: false, verified: false }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)
    authClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith', staffId: 123 })

    const result = await service.getUsers(token, ['Bob', 'June'])

    expect(result).toEqual([
      {
        username: 'Bob',
        name: 'Bob Smith',
        staffId: 123,
        email: 'an@email.com',
        missing: false,
        verified: true,
      },
      {
        username: 'June',
        name: undefined,
        staffId: undefined,
        email: undefined,
        missing: true,
        verified: false,
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
        missing: false,
        verified: true,
      },
      {
        username: 'JUNE',
        name: 'June Jones',
        staffId: 234,
        email: undefined,
        missing: false,
        verified: false,
      },
    ])

    expect(authClient.getEmail.mock.calls).toEqual([['BOB'], ['JUNE']])
  })

  it('should use the user token', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }

    authClient.getEmail.mockResolvedValueOnce(user1)
    authClient.getUser.mockResolvedValueOnce({ name: 'Bob Smith' })

    await service.getUsers(token, ['Bob'])

    expect(authClientBuilder).toBeCalledWith(token)
  })
})
