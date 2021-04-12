import nock from 'nock'
import PrisonClient from './prisonClient'
import config from '../config'
import restClientBuilder from '.'

describe('prisonClient', () => {
  let fakePrisonApi
  let prisonClient: PrisonClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonApi = nock(config.apis.prison.url)
    prisonClient = restClientBuilder('prisonClient', config.apis.prison, PrisonClient)(token)
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

      const output = await prisonClient.getOffenderDetails(12345)
      expect(output).toEqual(offenderResponse)
    })
  })

  describe('getUser', () => {
    const userResponse = {}
    it('should return data from api', async () => {
      fakePrisonApi.get('/api/users/me').matchHeader('authorization', `Bearer ${token}`).reply(200, userResponse)

      const output = await prisonClient.getUser()
      expect(output).toEqual(userResponse)
    })
  })
  describe('getUserbyUsername', () => {
    const userResponse = {
      staffId: 1,
      username: 'CA_USER',
      firstName: 'Ca',
      lastName: 'User',
      activeCaseLoadId: 'LEI',
      accountStatus: 'ACTIVE',
      active: true,
    }
    it('should return data from api', async () => {
      fakePrisonApi.get('/api/users/CA_USER').matchHeader('authorization', `Bearer ${token}`).reply(200, userResponse)

      const output = await prisonClient.getUserbyUsername('CA_USER')
      expect(output).toEqual(userResponse)
    })
  })
  describe('getUserCaseLoads', () => {
    const caseloads = []
    it('should return data from api', async () => {
      fakePrisonApi.get('/api/users/me/caseLoads').matchHeader('authorization', `Bearer ${token}`).reply(200, caseloads)

      const output = await prisonClient.getUserCaseLoads()
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

      const output = await prisonClient.getPrisons()
      expect(output).toEqual(locations)
    })
  })
  describe('getLocations', () => {
    const locations = []
    it('should return data from api', async () => {
      fakePrisonApi
        .get('/api/agencies/MDI/locations?eventType=OCCUR')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await prisonClient.getLocations('MDI')
      expect(output).toEqual(locations)
    })
    it('can search without filter', async () => {
      fakePrisonApi
        .get('/api/agencies/MDI/locations')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await prisonClient.getLocations('MDI', false)
      expect(output).toEqual(locations)
    })
  })

  describe('getLocation', () => {
    it('Should include inactive locations in request', async () => {
      const location = {
        agencyId: 'MDI',
        currentOccupancy: 0,
        description: 'Location',
        internalLocationCode: 'ILOC-01-01',
        locationId: 123,
        locationPrefix: 'ILOC',
        locationType: 'Thing',
        locationUsage: 'For things',
        operationalCapacity: 1,
        parentLocationId: 0,
        userDescription: 'Its a location',
      }
      fakePrisonApi
        .get('/api/locations/123?includeInactive=true')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, location)

      const output = await prisonClient.getLocation(123)
      expect(output).toEqual(location)
    })

    it('When location not found should return empty object', async () => {
      fakePrisonApi
        .get('/api/locations/123?includeInactive=true')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      const output = await prisonClient.getLocation(123)
      expect(output).toStrictEqual({})
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

      const output = await prisonClient.getOffenders(offenderNos)
      expect(output).toEqual(offenders)
    })
  })

  describe('getPrisoners', () => {
    it('should format query string', async () => {
      fakePrisonApi.get('/api/prisoners?offenderNo=A123&offenderNo=B123').matchHeader('page-limit', 5000).reply(200, [])

      const output = await prisonClient.getPrisoners(['A123', 'B123'])
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

      const output = await prisonClient.getPrisonById('MDI')
      expect(output).toEqual(mockPrison)
    })
  })
})
