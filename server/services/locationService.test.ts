import { PrisonClient, LocationClient } from '../data'
import type { Prison } from '../data/prisonClientTypes'
import LocationService from './locationService'
import config from '../config'
import { LocationInPrison } from '../types/locationsApi/locationsInPrisonTypes'

jest.mock('../data')
jest.mock('../config')

const token = 'token'

const prisonClient = new PrisonClient() as jest.Mocked<PrisonClient>
const locationClient = new LocationClient() as jest.Mocked<LocationClient>

const locationUUID = 'some-uuid'

let locationService

beforeEach(() => {
  locationService = new LocationService(prisonClient, locationClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('locationService', () => {
  describe('getPrisons', () => {
    it('should return all prisons details in alpha order', async () => {
      const prisonsMock = [
        {
          agencyId: 'P1',
          description: 'Zealand',
        },
        {
          agencyId: 'P2',
          description: 'Arlington',
        },
        {
          agencyId: 'P3',
          description: 'Harrow',
        },
      ] as Prison[]

      const prisonsInOrder = [
        {
          agencyId: 'P2',
          description: 'Arlington',
        },
        {
          agencyId: 'P3',
          description: 'Harrow',
        },
        {
          agencyId: 'P1',
          description: 'Zealand',
        },
      ] as Prison[]

      prisonClient.getPrisons.mockResolvedValue(prisonsMock)
      const result = await locationService.getPrisons(token)
      expect(result).toEqual(prisonsInOrder)
    })
  })

  describe('getLocation', () => {
    it('calls service correctly', async () => {
      locationClient.getLocation.mockResolvedValue({
        localName: 'Zealand',
        pathHierarchy: 'Z001',
      } as LocationInPrison)

      await locationService.getLocation(token, locationUUID)
      expect(locationClient.getLocation).toHaveBeenCalledWith(locationUUID, token)
    })

    it('should retrieve local name when one exists', async () => {
      locationClient.getLocation.mockResolvedValue({
        localName: 'Zealand',
        pathHierarchy: 'Z001',
      } as LocationInPrison)

      const result = await locationService.getLocation(token, locationUUID)
      expect(result).toEqual('Zealand')
    })

    it('should retrieve path hierarchy when local name does not exist', async () => {
      locationClient.getLocation.mockResolvedValue({ pathHierarchy: 'Z001' } as LocationInPrison)
      const result = await locationService.getLocation(token, locationUUID)
      expect(result).toEqual('Z001')
    })

    it('should default to empty string when neither local name or path hierarchy exist', async () => {
      locationClient.getLocation.mockResolvedValue({} as LocationInPrison)
      const result = await locationService.getLocation(token, locationUUID)
      expect(result).toEqual('')
    })
  })

  describe('getIncidentLocations', () => {
    it('should retrieve locations', async () => {
      locationClient.getLocations.mockResolvedValue([])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([])
      expect(locationClient.getLocations).toHaveBeenCalledWith('WRI', token)
    })

    it('should assign locationPrefix as userDescription when userDescription value is absent', async () => {
      locationClient.getLocations.mockResolvedValue([
        { key: 'P2', localName: undefined },
        { key: 'OC', localName: 'Other cell' },
        { key: 'P3', localName: 'place 3' },
        { key: 'PC', localName: "Prisoner's cell" },
        { key: 'P1', localName: 'place 1' },
        { key: 'P4', localName: undefined },
      ] as LocationInPrison[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { locationPrefix: 'PC', userDescription: "Prisoner's cell" },
        { locationPrefix: 'OC', userDescription: 'Other cell' },
        { locationPrefix: 'P2', userDescription: 'P2' },
        { locationPrefix: 'P4', userDescription: 'P4' },
        { locationPrefix: 'P1', userDescription: 'place 1' },
        { locationPrefix: 'P3', userDescription: 'place 3' },
      ])
    })

    it('should sort retrieved locations with top 2 primary locations at the beginning', async () => {
      locationClient.getLocations.mockResolvedValue([
        { localName: 'place 2' },
        { localName: 'Other cell' },
        { localName: 'place 3' },
        { localName: "Prisoner's cell" },
        { localName: 'place 1' },
        { localName: 'place 4' },
      ] as LocationInPrison[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { userDescription: "Prisoner's cell" },
        { userDescription: 'Other cell' },
        { userDescription: 'place 1' },
        { userDescription: 'place 2' },
        { userDescription: 'place 3' },
        { userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with only 1 primary location at the beginning', async () => {
      locationClient.getLocations.mockResolvedValue([
        { localName: 'place 2' },
        { localName: 'place 3' },
        { localName: "Prisoner's cell" },
        { localName: 'place 1' },
        { localName: 'place 4' },
      ] as LocationInPrison[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { userDescription: "Prisoner's cell" },
        { userDescription: 'place 1' },
        { userDescription: 'place 2' },
        { userDescription: 'place 3' },
        { userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero primary locations at the beginning', async () => {
      locationClient.getLocations.mockResolvedValue([
        { localName: 'place 2' },
        { localName: 'place 3' },
        { localName: 'place 1' },
        { localName: 'place 4' },
      ] as LocationInPrison[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { userDescription: 'place 1' },
        { userDescription: 'place 2' },
        { userDescription: 'place 3' },
        { userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero other locations', async () => {
      locationClient.getLocations.mockResolvedValue([
        { localName: 'Other cell' },
        { localName: "Prisoner's cell" },
        { localName: 'In cell' },
      ] as LocationInPrison[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { userDescription: "Prisoner's cell" },
        { userDescription: 'Other cell' },
        { userDescription: 'In cell' },
      ])
    })

    it('should use token', async () => {
      locationClient.getLocations.mockResolvedValue([])

      await locationService.getIncidentLocations(token, 'WRI')

      expect(locationClient.getLocations).toHaveBeenCalledWith('WRI', token)
    })

    it('should remove cell location options for prisons that are in and out of the feature flag', async () => {
      config.featureFlagRemoveCellLocationAgencies = ['HMI', 'MDI']
      locationClient.getLocations.mockResolvedValue([
        { localName: 'Other cell' },
        { localName: "Prisoner's cell" },
        { localName: 'In cell' },
        { localName: 'Test wing' },
      ] as LocationInPrison[])

      const result1 = await locationService.getIncidentLocations(token, 'HMI')
      expect(result1).toEqual([{ userDescription: 'Test wing' }])

      const result2 = await locationService.getIncidentLocations(token, 'MDI')
      expect(result2).toEqual([{ userDescription: 'Test wing' }])

      const result3 = await locationService.getIncidentLocations(token, 'ZZZ')
      expect(result3).toEqual([
        { userDescription: "Prisoner's cell" },
        { userDescription: 'Other cell' },
        { userDescription: 'In cell' },
        { userDescription: 'Test wing' },
      ])
    })
  })
})
