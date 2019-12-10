const nock = require('nock')
const config = require('../config')
const { userElite2ClientBuilder, systemElite2ClientBuilder } = require('../../server/data/elite2ClientBuilder')

describe('systemElite2Client', () => {
  let fakeElite2Api
  let systemElite2Client

  const username = 'username-1'
  const token = 'token-1'

  beforeEach(async () => {
    fakeElite2Api = nock(config.apis.elite2.url)
    systemElite2Client = await systemElite2ClientBuilder(username, async _ => token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getLocations', () => {
    const locations = []
    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/agencies/123/locations')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await systemElite2Client.getLocations(123)
      expect(output).toEqual(locations)
    })
  })

  describe('getLocation', () => {
    const location = {}
    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/locations/123')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, location)

      const output = await systemElite2Client.getLocation(123)
      expect(output).toEqual(location)
    })
  })

  describe('getOffenders', () => {
    const offenderNos = ['aaa', 'bbb']
    const offenders = []

    it('should return data from api', async () => {
      fakeElite2Api
        .post('/api/bookings/offenders', offenderNos)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenders)

      const output = await systemElite2Client.getOffenders(offenderNos)
      expect(output).toEqual(offenders)
    })
  })

  describe('getOffenderDetails', () => {
    const offenderDetails = {}

    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/bookings/123?basicInfo=false')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenderDetails)

      const output = await systemElite2Client.getOffenderDetails('123')
      expect(output).toEqual(offenderDetails)
    })
  })
})

describe('userElite2Client', () => {
  let fakeElite2Api
  let userElite2Client

  const token = 'token-1'

  beforeEach(() => {
    fakeElite2Api = nock(config.apis.elite2.url)
    userElite2Client = userElite2ClientBuilder(token)
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

      const output = await userElite2Client.getOffenderDetails('12345')
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

      const output = await userElite2Client.getUser()
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

      const output = await userElite2Client.getUserCaseLoads()
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

      const output = await userElite2Client.getLocations(123)
      expect(output).toEqual(locations)
    })
  })
})
