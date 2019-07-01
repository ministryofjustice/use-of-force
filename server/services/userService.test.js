const serviceCreator = require('./userService')

const token = 'token-1'

const elite2Client = {
  getUser: jest.fn(),
  getUserCaseLoads: jest.fn(),
}

const elite2ClientBuilder = jest.fn()

let service

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  service = serviceCreator(elite2ClientBuilder)
})

afterEach(() => {
  elite2Client.getUser.mockReset()
  elite2Client.getUserCaseLoads.mockReset()
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
