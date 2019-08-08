const serviceCreator = require('./userService')

const token = 'token-1'

const elite2Client = {
  getUser: jest.fn(),
  getUserCaseLoads: jest.fn(),
}

const authClient = {
  getEmail: jest.fn(),
}

const elite2ClientBuilder = jest.fn()
const authClientBuilder = jest.fn()

let service

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  authClientBuilder.mockReturnValue(authClient)

  service = serviceCreator(elite2ClientBuilder, authClientBuilder)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getUser', () => {
  it('should retrieve user details', async () => {
    const user = { firstName: 'SAM', lastName: 'SMITH', activeCaseLoadId: 2 }
    elite2Client.getUser.mockReturnValue(user)
    elite2Client.getUserCaseLoads.mockReturnValue([{ caseLoadId: 1 }, { caseLoadId: 2, name: 'Leeds' }])

    const result = await service.getUser(token)

    expect(result).toEqual({ ...user, displayName: 'Sam Smith', activeCaseLoad: { caseLoadId: 2, name: 'Leeds' } })
  })

  it('should use the user token', async () => {
    const user = { firstName: 'SAM', lastName: 'SMITH', activeCaseLoadId: 2 }
    elite2Client.getUser.mockReturnValue(user)
    elite2Client.getUserCaseLoads.mockReturnValue([{ caseLoadId: 1 }, { caseLoadId: 2, name: 'Leeds' }])

    await service.getUser(token, -5)

    expect(elite2ClientBuilder).toBeCalledWith(token)
  })
})

describe('getEmails', () => {
  it('All successfull', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'June', email: 'an@email.com', exists: true, verified: true }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)

    const result = await service.getEmails(token, ['Bob', 'June'])

    expect(result).toEqual({
      exist: [
        {
          email: 'an@email.com',
          exists: true,
          username: 'Bob',
          verified: true,
        },
        {
          email: 'an@email.com',
          exists: true,
          username: 'June',
          verified: true,
        },
      ],
      missing: [],
      notVerified: [],
      success: true,
    })
  })

  it('One non existent', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'June', exists: false, verified: true }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)

    const result = await service.getEmails(token, ['Bob', 'June'])

    expect(result).toEqual({
      exist: [
        {
          email: 'an@email.com',
          exists: true,
          username: 'Bob',
          verified: true,
        },
      ],
      missing: [{ exists: false, username: 'June', verified: true }],
      notVerified: [],
      success: false,
    })
  })

  it('One not verified', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com', exists: true, verified: true }
    const user2 = { username: 'June', exists: true, verified: false }

    authClient.getEmail.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2)

    const result = await service.getEmails(token, ['Bob', 'June'])

    expect(result).toEqual({
      exist: [
        {
          email: 'an@email.com',
          exists: true,
          username: 'Bob',
          verified: true,
        },
      ],
      missing: [],
      notVerified: [{ exists: true, username: 'June', verified: false }],
      success: false,
    })
  })

  it('should use the user token', async () => {
    const user1 = { username: 'Bob', email: 'an@email.com' }
    authClient.getEmail.mockReturnValue(user1)

    await service.getEmails(token, ['Bob'])

    expect(authClientBuilder).toBeCalledWith(token)
  })
})
