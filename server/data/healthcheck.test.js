const nock = require('nock')
const config = require('../config')
const healthcheck = require('./healthcheck')

describe('auth healthcheck', () => {
  let fakeAuthApi

  beforeEach(() => {
    fakeAuthApi = nock(`${config.apis.oauth2.url}`)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('check healthy', () => {
    it('should return data from api', async () => {
      fakeAuthApi.get('/ping').reply(200, 'ping')

      const output = await healthcheck.authCheck()
      expect(output).toEqual('OK')
    })
  })

  describe('check unhealthy', () => {
    it('should return data from api', async () => {
      fakeAuthApi.get('/ping').reply(404)

      return expect(healthcheck.authCheck()).rejects.toContain('404')
    })
  })
})
