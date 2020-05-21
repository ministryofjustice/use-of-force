import nock from 'nock'
import config from '../config'
import elite2ClientBuilder from './elite2ClientBuilder'

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

  describe('getPrisons', () => {
    const locations = []
    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/agencies/type/INST?active=true')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await elite2Client.getPrisons()
      expect(output).toEqual(locations)
    })
  })
  describe('getLocations', () => {
    const locations = []
    it('should return data from api', async () => {
      fakeElite2Api
        .get('/api/agencies/123/locations?eventType=OCCUR')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await elite2Client.getLocations(123)
      expect(output).toEqual(locations)
    })
    it('can search without filter', async () => {
      fakeElite2Api
        .get('/api/agencies/123/locations')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await elite2Client.getLocations(123, false)
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

  describe('getPrisoners', () => {
    it('should format query string', async () => {
      fakeElite2Api
        .get('/api/prisoners?offenderNo=A123&offenderNo=B123')
        .matchHeader('page-limit', 5000)
        .reply(200, [])

      const output = await elite2Client.getPrisoners(['A123', 'B123'])
      expect(output).toEqual([])
    })
  })
})
