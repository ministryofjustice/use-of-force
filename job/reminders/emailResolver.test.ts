import StatementsClient from '../../server/data/statementsClient'
import EmailResolver from './emailResolver'
import { ManageUsersApiClient } from '../../server/data'
import AuthService from '../../server/services/authService'

const client = { inTransaction: true }

jest.mock('../../server/data/statementsClient')
jest.mock('../../server/data/manageUsersApiClient')
jest.mock('../../server/services/authService')

const statementsClient = new StatementsClient(null) as jest.Mocked<StatementsClient>
const manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
const authService = new AuthService(null) as jest.Mocked<AuthService>

let emailResolver

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue('token-1')
  emailResolver = new EmailResolver(manageUsersApiClient, authService, statementsClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('resolve emails', () => {
  test('not verified', async () => {
    manageUsersApiClient.getEmail.mockResolvedValue({ username: 'BOB', exists: true, verified: false })

    const email = await emailResolver.resolveEmail(client, 'user1', 'report1')

    expect(email).toEqual(false)

    expect(manageUsersApiClient.getEmail).toHaveBeenCalledWith('user1', 'token-1')
    expect(statementsClient.setEmail).not.toHaveBeenCalled()
  })

  test('verified', async () => {
    manageUsersApiClient.getEmail.mockResolvedValue({
      username: 'BOB',
      exists: true,
      verified: true,
      email: 'user@gov.uk',
    })

    const email = await emailResolver.resolveEmail(client, 'user1', 'report1')

    expect(email).toEqual(true)

    expect(manageUsersApiClient.getEmail).toHaveBeenCalledWith('user1', 'token-1')
    expect(statementsClient.setEmail).toHaveBeenCalledWith('user1', 'report1', 'user@gov.uk', client)
  })
})
