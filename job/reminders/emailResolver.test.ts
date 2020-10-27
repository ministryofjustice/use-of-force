import { AuthClient } from '../../server/data/authClientBuilder'
import StatementsClient from '../../server/data/statementsClient'
import EmailResolver from './emailResolver'

const client = { inTransaction: true }

jest.mock('../../server/data/statementsClient')
jest.mock('../../server/data/authClientBuilder')

const statementsClient = new StatementsClient(null) as jest.Mocked<StatementsClient>
const authClient = new AuthClient(null) as jest.Mocked<AuthClient>

let authClientBuilder
let emailResolver

beforeEach(() => {
  authClientBuilder = jest.fn().mockReturnValue(authClient)
  emailResolver = new EmailResolver(authClientBuilder, async () => 'token-1', statementsClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('resolve emails', () => {
  test('not verified', async () => {
    authClient.getEmail.mockResolvedValue({ username: 'BOB', exists: true, verified: false })

    const email = await emailResolver.resolveEmail(client, 'user1', 'report1')

    expect(email).toEqual(false)

    expect(authClientBuilder).toHaveBeenCalledWith('token-1')
    expect(authClient.getEmail).toHaveBeenCalledWith('user1')
    expect(statementsClient.setEmail).not.toHaveBeenCalled()
  })

  test('verified', async () => {
    authClient.getEmail.mockResolvedValue({ username: 'BOB', exists: true, verified: true, email: 'user@gov.uk' })

    const email = await emailResolver.resolveEmail(client, 'user1', 'report1')

    expect(email).toEqual(true)

    expect(authClientBuilder).toHaveBeenCalledWith('token-1')
    expect(authClient.getEmail).toHaveBeenCalledWith('user1')
    expect(statementsClient.setEmail).toHaveBeenCalledWith('user1', 'report1', 'user@gov.uk', client)
  })
})
