const serviceCreator = require('./involvedStaffService')

const userService = {
  getUsers: jest.fn(),
}

const incidentClient = {
  getInvolvedStaff: jest.fn(),
  deleteInvolvedStaff: jest.fn(),
  insertInvolvedStaff: jest.fn(),
}

let service

beforeEach(() => {
  service = serviceCreator({ incidentClient, userService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('get', () => {
  test('it should call query on db', async () => {
    await service.get('incident-1')
    expect(incidentClient.getInvolvedStaff).toBeCalledTimes(1)
  })
})

describe('lookup', () => {
  test('skips lookup if no users provided', async () => {
    const result = await service.lookup('token-1', [])

    expect(result).toEqual({
      additionalErrors: [],
      additionalFields: {
        involvedStaff: [],
      },
    })
    expect(userService.getUsers).not.toBeCalled()
  })

  test('fails when invalid / unavailable users', async () => {
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

    const result = await service.lookup('token-1', ['Bob', 'June', 'Jenny'])

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

  test('fails with duplicate users', async () => {
    const result = await service.lookup('token-1', ['Bob', 'June', 'Bob', 'Jenny', 'Jenny'])

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

    const result = await service.lookup('token-1', ['Bob', 'June', 'Jenny'])

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

describe('updateInvolvedStaff', () => {
  test('should call update and pass in the form when form id is present', async () => {
    await service.update('form1', [{ name: 'Bob', username: 'BOB', email: 'bob@gov.uk' }])

    expect(incidentClient.deleteInvolvedStaff).toBeCalledWith('form1')
    expect(incidentClient.insertInvolvedStaff).toBeCalledTimes(1)
    expect(incidentClient.insertInvolvedStaff).toBeCalledWith('form1', [
      { userId: 'BOB', name: 'Bob', email: 'bob@gov.uk' },
    ])
  })
})
