import HmppsAuthClient from '../data/hmppsAuthClient'
import AuthService from './authService'

jest.mock('../data/hmppsAuthClient')

describe('Auth service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let authService: AuthService

  beforeEach(() => {
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    authService = new AuthService(hmppsAuthClient)
  })

  describe('getSystemClientToken', () => {
    it('calls the correct client function', async () => {
      await authService.getSystemClientToken('Testuser')

      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('Testuser')
    })
  })
})
