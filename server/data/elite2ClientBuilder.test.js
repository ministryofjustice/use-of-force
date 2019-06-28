const nock = require('nock')
const { getNamespace } = require('cls-hooked')
const config = require('../config')
const elite2ClientBuilder = require('../../server/data/elite2ClientBuilder')

jest.mock('cls-hooked')

describe('elite2Client', () => {
  let fakeElite2Api
  let elite2Client

  const token = 'token-1'

  beforeEach(() => {
    fakeElite2Api = nock(`${config.apis.elite2.url}`)
    elite2Client = elite2ClientBuilder(token)
    getNamespace.mockReturnValue({ get: () => 'myuser' })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getOffenderDetails', () => {
    it('should return data from api', async () => {
      const offenderResponse = {}
      fakeElite2Api
        .get(`/api/bookings/12345?basicInfo=false`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenderResponse)

      const output = await elite2Client.getOffenderDetails('12345')
      expect(output).toEqual(offenderResponse)
    })
  })

  describe('getUser', () => {
    const userResponse = {}
    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/users/me')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, userResponse)

      const output = await elite2Client.getUser()
      expect(output).toEqual(userResponse)
    })
  })

  describe('getUserCaseLoads', () => {
    const caseloads = []
    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/users/me/caseLoads')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, caseloads)

      const output = await elite2Client.getUserCaseLoads()
      expect(output).toEqual(caseloads)
    })
  })
})
