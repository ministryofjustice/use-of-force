import serviceCreator from './locationService'

const elite2ClientBuilder = jest.fn()
import incidentClient = require('../data/incidentClient')
const token = 'token'

const elite2Client = {
  getActiveAgenciesByType: jest.fn(),
  getPrisonById: jest.fn(),
}

incidentClient.updateAgencyId = jest.fn()

let locationService

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  locationService = serviceCreator({ elite2ClientBuilder })
})

afterEach(() => {
  elite2Client.getActiveAgenciesByType.mockReset()
  elite2Client.getPrisonById.mockReset()
})

describe('locationService', () => {
  describe('getActiveAgenciesByType', () => {
    it('should return no prison', async () => {
      const prisons = ['hello']

      elite2Client.getActiveAgenciesByType.mockReturnValue(prisons)
      const result = await locationService.getActiveAgenciesByType(token, 'INST')
      expect(result).toEqual(prisons)
    })

    it('should return all prisons details in alpha order', async () => {
      const prisonsMock = [
        {
          agencyId: 'AGY1',
          description: 'XYZ',
        },
        {
          agencyId: 'AGY2',
          description: 'ABC',
        },
        {
          agencyId: 'AGY3',
          description: 'DEF',
        },
      ]

      const prisonsInOrder = [
        {
          agencyId: 'AGY2',
          description: 'ABC',
        },
        {
          agencyId: 'AGY3',
          description: 'DEF',
        },
        {
          agencyId: 'AGY1',
          description: 'XYZ',
        },
      ]

      elite2Client.getActiveAgenciesByType.mockReturnValue(prisonsMock)
      const result = await locationService.getActiveAgenciesByType(token, 'INST')
      expect(result).toEqual(prisonsInOrder)
    })
  })

  describe('getPrisonById', () => {
    it('should return single prison', async () => {
      const prison = {
        agencyId: 'MDI',
        description: 'ABC',
      }

      elite2Client.getPrisonById.mockReturnValue(prison)
      const result = await locationService.getPrisonById(token, 'MDI')
      expect(result).toEqual(prison)
    })
  })

  describe('updateAgencyId', () => {
    it('incidentClient.updateAgencyId should be called', async () => {
      await locationService.updateAgencyId('x', 'y', 'z')
      expect(incidentClient.updateAgencyId).toBeCalledWith('x', 'y', 'z')
    })
  })
})
