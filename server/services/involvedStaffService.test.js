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
  test('current user is returned, even if no other users are provided', async () => {
    userService.getUsers.mockReturnValue({
      exist: [
        {
          i: 0,
          email: 'ann@email.com',
          exists: true,
          name: 'Anne Admin',
          username: 'Anne',
          verified: true,
        },
      ],
      missing: [],
      notVerified: [],
      success: true,
    })

    const result = await service.getInvolvedStaff({ token: 'token-1', username: 'Anne' }, [])

    expect(result).toEqual({
      additionalErrors: [],
      additionalFields: {
        involvedStaff: [
          {
            email: 'ann@email.com',
            exists: true,
            i: 0,
            name: 'Anne Admin',
            username: 'Anne',
            verified: true,
          },
        ],
      },
    })
    expect(userService.getUsers).toBeCalledWith('token-1', ['Anne'])
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

    const result = await service.getInvolvedStaff({ token: 'token-1', username: 'Anne' }, ['Bob', 'June', 'Jenny'])

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

  test('fails duplicate users', async () => {
    const result = await service.getInvolvedStaff({ token: 'token-1', username: 'Anne' }, [
      'Bob',
      'June',
      'Bob',
      'Jenny',
      'Jenny',
    ])

    expect(result).toEqual({
      additionalFields: {},
      additionalErrors: [
        {
          i: 2,
          href: '#involved[2][username]',
          text: "User with name 'Bob' has already been added",
        },
        {
          i: 4,
          href: '#involved[4][username]',
          text: "User with name 'Jenny' has already been added",
        },
      ],
    })
  })

  test('success', async () => {
    userService.getUsers
      .mockReturnValueOnce({
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
      .mockReturnValueOnce({
        exist: [
          {
            i: 0,
            email: 'ann@email.com',
            exists: true,
            name: 'Anne Admin',
            username: 'Anne',
            verified: true,
          },
        ],
        missing: [],
        notVerified: [],
        success: true,
      })

    const result = await service.getInvolvedStaff({ token: 'token-1', username: 'Anne' }, ['Bob', 'June', 'Jenny'])

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
          {
            email: 'ann@email.com',
            exists: true,
            i: 0,
            name: 'Anne Admin',
            username: 'Anne',
            verified: true,
          },
        ],
      },
      additionalErrors: [],
    })
  })
})
