const nock = require('nock')
const { getNamespace } = require('cls-hooked')
const config = require('../../server/config')
const nomisClientBuilder = require('../../server/data/nomisClientBuilder')

jest.mock('cls-hooked')

describe('nomisClient', () => {
  let fakeElite2Api
  let nomisClient

  const offenderResponse = {}
  const token = 'token-1'

  beforeEach(() => {
    fakeElite2Api = nock(`${config.apis.elite2.url}`)
    nomisClient = nomisClientBuilder(token)
    getNamespace.mockReturnValue({ get: () => 'myuser' })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getOffenderDetails', () => {
    it('should return data from api', async () => {
      fakeElite2Api
        .get(`/api/bookings/12345?basicInfo=false`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenderResponse)

      const output = await nomisClient.getOffenderDetails('12345')
      expect(output).toEqual(offenderResponse)
      fakeElite2Api.done()
    })
  })
})
