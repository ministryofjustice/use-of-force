import nock from 'nock'
import LocationClient from './locationClient'
import config from '../config'
import { NonResidentialServiceType } from '../config/types'

describe('locationClient', () => {
  let fakeLocationApi
  let locationClient: LocationClient

  const token = 'token-1'
  const locationId = '00000000-1111-2222-3333-444444444444'
  beforeEach(() => {
    fakeLocationApi = nock(config.apis.location.url)
    locationClient = new LocationClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getLocation', () => {
    it('Should GET location', async () => {
      const location = {
        id: locationId,
        localName: 'Cell A',
        prisonId: 'MDI',
        pathHierarchy: 'CELL-A',
        key: 'MDI-CELL-A',
      }
      fakeLocationApi
        .get(`/locations/${locationId}?formatLocalName=true`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, location)

      const output = await locationClient.getLocation(locationId, token)
      expect(output).toEqual(location)
    })

    it('should return undefined if locationId not required length for UUID', async () => {
      fakeLocationApi
        .get(`/locations/00000000-1111-2222-3333`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)
      const result = await locationClient.getLocation('00000000-1111-2222-3333', token)
      expect(result).toEqual(undefined)
    })

    it('should return undefined when api returns 404', async () => {
      fakeLocationApi
        .get(`/locations/${locationId}?formatLocalName=true`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)
      const result = await locationClient.getLocation(locationId, token)
      expect(result).toEqual(undefined)
    })

    it('should throw for non-404 errors', async () => {
      fakeLocationApi
        .get(`/locations/${locationId}?formatLocalName=true`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(400)
      await expect(locationClient.getLocation(locationId, token)).rejects.toThrow('Bad Request')
    })
  })
  describe('getLocations', () => {
    const locations = []
    it('should return data from api', async () => {
      fakeLocationApi
        .get('/locations/non-residential/prison/MDI/service/USE_OF_FORCE?formatLocalName=true&sortByLocalName=true')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, locations)

      const output = await locationClient.getLocations('MDI', token)
      expect(output).toEqual(locations)
    })
    it('can not search with incorrect usage-type filter', async () => {
      fakeLocationApi
        .get('/locations/non-residential/prison/MDI/service/SOME-TYPE?formatLocalName=true&sortByLocalName=true')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(400)

      await expect(locationClient.getLocations('MDI', token, 'SOME-TYPE' as NonResidentialServiceType)).rejects.toThrow(
        'Bad Request'
      )
    })
  })
})
