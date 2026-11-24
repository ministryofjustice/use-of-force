import nock from 'nock'
import ManageUsersApiClient from './manageUsersApiClient'
import config from '../config'

describe('manageUsersApiClient', () => {
  let fakeManageUsersApi: nock.Scope
  let client: ManageUsersApiClient

  const token = 'token-1'

  beforeEach(() => {
    fakeManageUsersApi = nock(config.apis.hmppsManageUsersApi.url)
    client = new ManageUsersApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getCurrentUser', () => {
    it('should return the signed in user from the api', async () => {
      const user = { username: 'JOUSER', name: 'Jo Smith', staffId: 3, activeCaseLoadId: 'MDI' }
      fakeManageUsersApi.get('/users/me').matchHeader('authorization', `Bearer ${token}`).reply(200, user)

      const output = await client.getCurrentUser(token)

      expect(output).toEqual(user)
    })
  })
})
