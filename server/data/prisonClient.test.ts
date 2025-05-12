import nock from 'nock'
import PrisonClient from './prisonClient'
import config from '../config'

describe('prisonClient', () => {
  let fakePrisonApi
  let prisonClient: PrisonClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonApi = nock(config.apis.prison.url)
    prisonClient = new PrisonClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getOffenderDetails', () => {
    it('should return data from api', async () => {
      const offenderResponse = {}
      fakePrisonApi
        .get(`/api/bookings/12345?basicInfo=false`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenderResponse)

      const output = await prisonClient.getOffenderDetails('12345', token)
      expect(output).toEqual(offenderResponse)
    })
  })

  describe('getUser', () => {
    const userResponse = {}
    it('should return data from api', async () => {
      fakePrisonApi.get('/api/users/me').matchHeader('authorization', `Bearer ${token}`).reply(200, userResponse)

      const output = await prisonClient.getUser(token)
      expect(output).toEqual(userResponse)
    })
  })

  describe('getUserCaseLoads', () => {
    const caseloads = []
    it('should return data from api', async () => {
      fakePrisonApi.get('/api/users/me/caseLoads').matchHeader('authorization', `Bearer ${token}`).reply(200, caseloads)

      const output = await prisonClient.getUserCaseLoads(token)
      expect(output).toEqual(caseloads)
    })
  })

  describe('getPrisons', () => {
    const locations = []
    it('should return data from api', async () => {
      fakePrisonApi
        .get('/api/agencies/type/INST?active=true')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await prisonClient.getPrisons(token)
      expect(output).toEqual(locations)
    })
  })

  describe('getOffenders', () => {
    const offenderNos = ['aaa', 'bbb']
    const offenders = []

    it('should return data from api', async () => {
      fakePrisonApi
        .post('/api/bookings/offenders?activeOnly=false', offenderNos)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, offenders)

      const output = await prisonClient.getOffenders(offenderNos, token)
      expect(output).toEqual(offenders)
    })
  })

  describe('getPrisoners', () => {
    it('should format query string', async () => {
      fakePrisonApi.get('/api/prisoners?offenderNo=A123&offenderNo=B123').matchHeader('page-limit', 5000).reply(200, [])

      const output = await prisonClient.getPrisoners(['A123', 'B123'], token)
      expect(output).toEqual([])
    })
  })

  describe('getPrisonById', () => {
    const mockPrison = {
      active: true,
      agencyId: 'MDI',
      agencyType: 'INST',
      description: 'Moorland',
    }
    it('should return prison details from its id', async () => {
      fakePrisonApi.get('/api/agencies/MDI?activeOnly=false').reply(200, mockPrison)

      const output = await prisonClient.getPrisonById('MDI', token)
      expect(output).toEqual(mockPrison)
    })
  })
})
