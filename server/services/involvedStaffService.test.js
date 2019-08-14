const serviceCreator = require('./involvedStaffService')

const userService = {
  getUsers: jest.fn(),
}

let service

beforeEach(() => {
  service = serviceCreator({ userService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getInvolvedStaff', () => {
  test('not called when there are no provided users', async () => {
    const result = await service.getInvolvedStaff('token-1', [])

    expect(result).toEqual({ additionalErrors: [], additionalFields: {} })
    expect(userService.getUsers).not.toBeCalled()
  })

  test('failed as invalid and unavailable users', async () => {
    userService.getUsers.mockReturnValue({
      exist: [
        {
          i: 0,
          email: 'an@email.com',
          exists: true,
          name: 'Bob Smith',
          username: 'Bob',
          verified: true,
        },
      ],
      missing: [{ i: 1, exists: false, username: 'June', verified: false }],
      notVerified: [{ i: 2, exists: true, username: 'Jenny', verified: false }],
      success: false,
    })

    const result = await service.getInvolvedStaff('token-1', ['Bob', 'June', 'Jenny'])

    expect(result).toEqual({
      additionalFields: {},
      additionalErrors: [
        {
          href: '#involved[1][username]',
          text: "User with name 'June' does not have a new nomis account",
        },
        {
          href: '#involved[2][username]',
          text: "User with name 'Jenny' has not verified their email address",
        },
      ],
    })
  })

  test('success', async () => {
    userService.getUsers.mockReturnValue({
      exist: [
        {
          i: 2,
          email: 'an@email.com',
          exists: true,
          name: 'Bob Smith',
          username: 'Bob',
          verified: true,
        },
        { i: 0, exists: true, email: 'bn@email.com', username: 'June', verified: true },
        { i: 1, exists: true, email: 'cn@email.com', username: 'Jenny', verified: true },
      ],
      missing: [],
      notVerified: [],
      success: true,
    })

    const result = await service.getInvolvedStaff('token-1', ['Bob', 'June', 'Jenny'])

    expect(result).toEqual({
      additionalFields: {
        involvedStaff: [
          {
            exists: true,
            i: 0,
            email: 'bn@email.com',
            username: 'June',
            verified: true,
          },
          {
            exists: true,
            i: 1,
            email: 'cn@email.com',
            username: 'Jenny',
            verified: true,
          },
          {
            email: 'an@email.com',
            exists: true,
            i: 2,
            name: 'Bob Smith',
            username: 'Bob',
            verified: true,
          },
        ],
      },
      additionalErrors: [],
    })
  })
})
