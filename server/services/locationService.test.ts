import serviceCreator from './locationService'

const elite2ClientBuilder = jest.fn()
const incidentClient = { updateAgencyId: jest.fn() }
const token = 'token'

const elite2Client = {
  getPrisons: jest.fn(),
  getPrisonById: jest.fn(),
  getLocations: jest.fn(),
}

let locationService

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  locationService = serviceCreator(elite2ClientBuilder, incidentClient)
})

afterEach(() => {
  elite2Client.getPrisons.mockReset()
  elite2Client.getPrisonById.mockReset()
})

describe('locationService', () => {
  describe('getPrisons', () => {
    it('should not return a prison', async () => {
      const prisons = ['no prison']

      elite2Client.getPrisons.mockReturnValue(prisons)
      const result = await locationService.getPrisons(token)
      expect(result).toEqual(prisons)
    })

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
      ]

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
      ]

      elite2Client.getPrisons.mockReturnValue(prisonsMock)
      const result = await locationService.getPrisons(token)
      expect(result).toEqual(prisonsInOrder)
    })
  })

  describe('getIncidentLocations', () => {
    it('should retrieve locations', async () => {
      elite2Client.getLocations.mockReturnValue([])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([])
      expect(elite2Client.getLocations).toBeCalledWith('WRI')
    })

    it('should sort retrieved locations with top 2 primary locations at the begining', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 2, userDescription: 'place 2' },
        { id: 6, userDescription: 'Other cell' },
        { id: 3, userDescription: 'place 3' },
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 1, userDescription: 'place 1' },
        { id: 4, userDescription: 'place 4' },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 6, userDescription: 'Other cell' },
        { id: 1, userDescription: 'place 1' },
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 4, userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with only 1 primary location at the begining', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 1, userDescription: 'place 1' },
        { id: 4, userDescription: 'place 4' },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 1, userDescription: 'place 1' },
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 4, userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero primary locations at the begining', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 1, userDescription: 'place 1' },
        { id: 4, userDescription: 'place 4' },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 1, userDescription: 'place 1' },
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 4, userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero other locations', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 6, userDescription: 'Other cell' },
        { id: 5, userDescription: "Prisoner's cell" },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 6, userDescription: 'Other cell' },
      ])
    })

    it('should use token', async () => {
      await locationService.getIncidentLocations(token, 'WRI')

      expect(elite2ClientBuilder).toBeCalledWith(token)
    })
  })
})
