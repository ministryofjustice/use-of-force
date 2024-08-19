import { PrisonClient } from '../data'
import type { Prison, PrisonLocation } from '../data/prisonClientTypes'
import LocationService from './locationService'
import config from '../config'

jest.mock('../data')
jest.mock('../config')

const prisonClientBuilder = jest.fn()
const token = 'token'

const prisonClient = new PrisonClient(null) as jest.Mocked<PrisonClient>

let locationService

beforeEach(() => {
  prisonClientBuilder.mockReturnValue(prisonClient)
  locationService = new LocationService(prisonClientBuilder)
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
      prisonClient.getLocation.mockResolvedValue({
        userDescription: 'Zealand',
        locationPrefix: 'Z001',
      } as PrisonLocation)

      await locationService.getLocation(token, 123)

      expect(prisonClient.getLocation).toBeCalledWith(123)
    })

    it('should retrieve user description when one exists', async () => {
      prisonClient.getLocation.mockResolvedValue({
        userDescription: 'Zealand',
        locationPrefix: 'Z001',
      } as PrisonLocation)

      const result = await locationService.getLocation(token, 123)

      expect(result).toEqual('Zealand')
    })

    it('should retrieve prefix when user description exists', async () => {
      prisonClient.getLocation.mockResolvedValue({ locationPrefix: 'Z001' } as PrisonLocation)

      const result = await locationService.getLocation(token, 123)

      expect(result).toEqual('Z001')
    })

    it('should default to empty string when neither user description or prefix exist', async () => {
      prisonClient.getLocation.mockResolvedValue({} as PrisonLocation)

      const result = await locationService.getLocation(token, 123)

      expect(result).toEqual('')
    })

    it('should default to empty string when neither location doesnt exist', async () => {
      prisonClient.getLocation.mockResolvedValue(undefined)

      const result = await locationService.getLocation(token, 123)

      expect(result).toEqual('')
    })
  })

  describe('getIncidentLocations', () => {
    it('should retrieve locations', async () => {
      prisonClient.getLocations.mockResolvedValue([])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([])
      expect(prisonClient.getLocations).toBeCalledWith('WRI')
    })

    it('should assign internalLocationCode as userDescription when userDescription value is absent', async () => {
      prisonClient.getLocations.mockResolvedValue([
        { locationPrefix: 'P2', userDescription: undefined },
        { locationPrefix: 'OC', userDescription: 'Other cell' },
        { locationPrefix: 'P3', userDescription: 'place 3' },
        { locationPrefix: 'PC', userDescription: "Prisoner's cell" },
        { locationPrefix: 'P1', userDescription: 'place 1' },
        { locationPrefix: 'P4', userDescription: undefined },
      ] as PrisonLocation[])

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
      prisonClient.getLocations.mockResolvedValue([
        { userDescription: 'place 2' },
        { userDescription: 'Other cell' },
        { userDescription: 'place 3' },
        { userDescription: "Prisoner's cell" },
        { userDescription: 'place 1' },
        { userDescription: 'place 4' },
      ] as PrisonLocation[])

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

    it('should sort retrieved locations with only 1 primary location at the begining', async () => {
      prisonClient.getLocations.mockResolvedValue([
        { userDescription: 'place 2' },
        { userDescription: 'place 3' },
        { userDescription: "Prisoner's cell" },
        { userDescription: 'place 1' },
        { userDescription: 'place 4' },
      ] as PrisonLocation[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { userDescription: "Prisoner's cell" },
        { userDescription: 'place 1' },
        { userDescription: 'place 2' },
        { userDescription: 'place 3' },
        { userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero primary locations at the begining', async () => {
      prisonClient.getLocations.mockResolvedValue([
        { userDescription: 'place 2' },
        { userDescription: 'place 3' },
        { userDescription: 'place 1' },
        { userDescription: 'place 4' },
      ] as PrisonLocation[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { userDescription: 'place 1' },
        { userDescription: 'place 2' },
        { userDescription: 'place 3' },
        { userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero other locations', async () => {
      prisonClient.getLocations.mockResolvedValue([
        { userDescription: 'Other cell' },
        { userDescription: "Prisoner's cell" },
        { userDescription: 'In cell' },
      ] as PrisonLocation[])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { userDescription: "Prisoner's cell" },
        { userDescription: 'Other cell' },
        { userDescription: 'In cell' },
      ])
    })

    it('should use token', async () => {
      prisonClient.getLocations.mockResolvedValue([])

      await locationService.getIncidentLocations(token, 'WRI')

      expect(prisonClientBuilder).toBeCalledWith(token)
    })

    it('should remove cell locations for prison in feature flag', async () => {
      config.featureFlagRemoveCellLocations = 'HMI'
      prisonClient.getLocations.mockResolvedValue([
        { userDescription: 'Other cell' },
        { userDescription: "Prisoner's cell" },
        { userDescription: 'In cell' },
        { userDescription: 'Test wing' },
      ] as PrisonLocation[])

      const result = await locationService.getIncidentLocations(token, 'HMI')

      expect(result).toEqual([{ userDescription: 'Test wing' }])
    })

    it('should not remove cell locations for prison in feature flag', async () => {
      config.featureFlagRemoveCellLocations = 'HMI'
      prisonClient.getLocations.mockResolvedValue([
        { userDescription: 'Other cell' },
        { userDescription: "Prisoner's cell" },
        { userDescription: 'In cell' },
        { userDescription: 'Test wing' },
      ] as PrisonLocation[])

      const result = await locationService.getIncidentLocations(token, 'MDI')

      expect(result).toEqual([
        { userDescription: "Prisoner's cell" },
        { userDescription: 'Other cell' },
        { userDescription: 'In cell' },
        { userDescription: 'Test wing' },
      ])
    })
  })
})
