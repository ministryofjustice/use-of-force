const nock = require('nock')
const config = require('../config')
const elite2ClientBuilder = require('../../server/data/elite2ClientBuilder')

describe('elite2Client', () => {
  let fakeElite2Api
  let elite2Client

  const token = 'token-1'

  beforeEach(() => {
    fakeElite2Api = nock(config.apis.elite2.url)
    elite2Client = elite2ClientBuilder(token)
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

  describe('getLocations', () => {
    const locations = []
    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/agencies/123/locations')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await elite2Client.getLocations(123)
      expect(output).toEqual(locations)
    })
  })

  describe('getOffenders', () => {
    const offenderNos = ['aaa', 'bbb']
    const offenders = []

    it('should return data from api', async () => {
      fakeElite2Api
        .post('/api/bookings/offenders?activeOnly=false', offenderNos)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenders)

      const output = await elite2Client.getOffenders(offenderNos)
      expect(output).toEqual(offenders)
    })
  })
})
