const EmailResolver = require('./emailResolver')

const client = { inTransaction: true }

let authClientBuilder
const authClient = {
  getEmail: jest.fn(),
}

const statementsClient = {
  setEmail: jest.fn(),
}

let emailResolver

beforeEach(() => {
  authClientBuilder = jest.fn().mockReturnValue(authClient)
  emailResolver = new EmailResolver(authClientBuilder, () => 'token-1', statementsClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('resolve emails', () => {
  test('not verified', async () => {
    authClient.getEmail.mockResolvedValue({ verified: false })

    const email = await emailResolver.resolveEmail(client, 'user1', 'report1')

    expect(email).toEqual(false)

    expect(authClientBuilder).toHaveBeenCalledWith('token-1')
    expect(authClient.getEmail).toHaveBeenCalledWith('user1')
    expect(statementsClient.setEmail).not.toHaveBeenCalled()
  })

  test('verified', async () => {
    authClient.getEmail.mockResolvedValue({ verified: true, email: 'user@gov.uk' })

    const email = await emailResolver.resolveEmail(client, 'user1', 'report1')

    expect(email).toEqual(true)

    expect(authClientBuilder).toHaveBeenCalledWith('token-1')
    expect(authClient.getEmail).toHaveBeenCalledWith('user1')
    expect(statementsClient.setEmail).toHaveBeenCalledWith('user1', 'report1', 'user@gov.uk', client)
  })
})
