import nock from 'nock'
import config from '../config'
import { AuthClient, authClientBuilder, systemToken } from './authClientBuilder'

describe('authClient', () => {
  let fakeApi
  let client: AuthClient

  const token = 'token-1'

  beforeEach(() => {
    fakeApi = nock(config.apis.oauth2.url)
    client = authClientBuilder(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getEmail', () => {
    const userName = 'Bob'
    const userResponse = { username: 'BOB', email: 'an@email.com' }

    it('email exists', async () => {
      fakeApi
        .get(`/api/user/${userName}/email`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, userResponse)

      const output = await client.getEmail(userName)
      expect(output).toEqual({ username: 'BOB', email: 'an@email.com', exists: true, verified: true })
    })

    it('no verified email exists', async () => {
      fakeApi.get(`/api/user/${userName}/email`).matchHeader('authorization', `Bearer ${token}`).reply(204)

      const output = await client.getEmail(userName)
      expect(output).toEqual({ username: 'Bob', exists: true, verified: false })
    })

    it('user doesnt exist', async () => {
      fakeApi.get(`/api/user/${userName}/email`).matchHeader('authorization', `Bearer ${token}`).reply(404)

      const output = await client.getEmail(userName)
      expect(output).toEqual({ username: 'Bob', exists: false, verified: false })
    })

    it('username offends the auth service', async () => {
      fakeApi.get(`/api/user/${userName}/email`).matchHeader('authorization', `Bearer ${token}`).reply(400)

      expect(client.getEmail(userName)).rejects.toThrow('Bad Request')
    })

    it('not authorised error', async () => {
      fakeApi.get(`/api/user/${userName}/email`).matchHeader('authorization', `Bearer ${token}`).reply(401)

      expect(client.getEmail(userName)).rejects.toThrow('Unauthorized')
    })
  })

  describe('getUser', () => {
    const userName = 'Bob'
    const userResponse = { username: 'Bob', email: 'an@email.com' }

    it('user exists', async () => {
      fakeApi.get(`/api/user/${userName}`).matchHeader('authorization', `Bearer ${token}`).reply(200, userResponse)

      const output = await client.getUser(userName)
      expect(output).toEqual(userResponse)
    })
  })

  describe('getUsers', () => {
    const user1 = { username: 'Bob', email: 'an@email.com' }
    const user2 = { username: 'Jo', email: 'bn@email.com' }

    it('getUsers', async () => {
      fakeApi.get(`/api/user/${user1.username}`).matchHeader('authorization', `Bearer ${token}`).reply(200, user1)
      fakeApi.get(`/api/user/${user2.username}`).matchHeader('authorization', `Bearer ${token}`).reply(200, user2)

      const output = await client.getUsers([user1.username, user2.username])
      expect(output).toEqual(expect.arrayContaining([user1, user2]))
    })
  })

  describe('findUser', () => {
    const userResponse = { username: 'Bob', email: 'an@email.com' }

    it('user exists', async () => {
      fakeApi
        .get(`/api/prisonuser?firstName=bob&lastName=smith`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, userResponse)

      const output = await client.findUsers('bob', 'smith')
      expect(output).toEqual(userResponse)
    })

    it('it trims names', async () => {
      fakeApi
        .get(`/api/prisonuser?firstName=bob&lastName=smith`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, userResponse)

      const output = await client.findUsers('  bob    ', '   smith    ')
      expect(output).toEqual(userResponse)
    })
  })

  describe('systemToken', () => {
    const tokenObject = { access_token: 'token-1' }
    it('with username', async () => {
      const userName = 'Bob'
      fakeApi
        .post(`/oauth/token`, 'grant_type=client_credentials&username=Bob')
        .basicAuth({ user: config.apis.oauth2.systemClientId, pass: config.apis.oauth2.systemClientSecret })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, tokenObject)

      const output = await systemToken(userName)
      expect(output).toEqual(tokenObject.access_token)
    })

    it('without username', async () => {
      fakeApi
        .post(`/oauth/token`, 'grant_type=client_credentials')
        .basicAuth({ user: config.apis.oauth2.systemClientId, pass: config.apis.oauth2.systemClientSecret })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, tokenObject)

      const output = await systemToken()
      expect(output).toEqual(tokenObject.access_token)
    })
  })
})
