const nock = require('nock')
const healthcheck = require('./healthcheck')

describe('service healthcheck', () => {
  let fakeServiceApi

  beforeEach(() => {
    fakeServiceApi = nock('http://test-service.com')
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('check healthy', () => {
    it('should return data from api', async () => {
      fakeServiceApi.get('/ping').reply(200, 'ping')

      const output = await healthcheck.serviceCheck('externalService', 'http://test-service.com/ping')
      expect(output).toEqual('OK')
    })
  })

  describe('check unhealthy', () => {
    it('should throw error from api', async () => {
      fakeServiceApi.get('/ping').reply(404)

      return expect(healthcheck.serviceCheck('externalService', 'http://test-service.com/ping')).rejects.toContain(
        '404'
      )
    })
  })
})
