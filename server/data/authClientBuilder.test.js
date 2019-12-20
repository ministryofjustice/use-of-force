const nock = require('nock')
const config = require('../config')
const { authClientBuilder, getApiClientToken } = require('./authClientBuilder')

describe('authClient', () => {
  let fakeApi
  let client

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
    const userResponse = { username: 'Bob', email: 'an@email.com' }

    it('email exists', async () => {
      fakeApi
        .get(`/api/user/${userName}/email`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, userResponse)

      const output = await client.getEmail(userName)
      expect(output).toEqual({ username: 'Bob', email: 'an@email.com', exists: true, verified: true })
    })

    it('no verified email exists', async () => {
      fakeApi
        .get(`/api/user/${userName}/email`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(204)

      const output = await client.getEmail(userName)
      expect(output).toEqual({ username: 'Bob', exists: true, verified: false })
    })

    it('user doesnt exist', async () => {
      fakeApi
        .get(`/api/user/${userName}/email`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      const output = await client.getEmail(userName)
      expect(output).toEqual({ username: 'Bob', exists: false, verified: false })
    })

    it('username offends the auth service', async () => {
      fakeApi
        .get(`/api/user/${userName}/email`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(400)

      const output = await client.getEmail(userName)
      expect(output).toEqual({ username: 'Bob', exists: false, verified: false })
    })
  })

  describe('getUser', () => {
    const userName = 'Bob'
    const userResponse = { username: 'Bob', email: 'an@email.com' }

    it('user exists', async () => {
      fakeApi
        .get(`/api/user/${userName}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, userResponse)

      const output = await client.getUser(userName)
      expect(output).toEqual(userResponse)
    })
  })

  describe('getApiClientToken', () => {
    it('with username', async () => {
      const userName = 'Bob'
      fakeApi
        .post(`/oauth/token`, 'grant_type=client_credentials&username=Bob')
        .basicAuth({ user: config.apis.oauth2.apiClientId, pass: config.apis.oauth2.apiClientSecret })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, token)

      const output = await getApiClientToken(userName)
      expect(output.text).toEqual(token)
    })

    it('without username', async () => {
      fakeApi
        .post(`/oauth/token`, 'grant_type=client_credentials')
        .basicAuth({ user: config.apis.oauth2.apiClientId, pass: config.apis.oauth2.apiClientSecret })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, token)

      const output = await getApiClientToken()
      expect(output.text).toEqual(token)
    })
  })
})
