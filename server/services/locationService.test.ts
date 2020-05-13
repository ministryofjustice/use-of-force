import serviceCreator from './locationService'

const elite2ClientBuilder = jest.fn()
import incidentClient = require('../data/incidentClient')
const token = 'token'

const elite2Client = {
  getPrisons: jest.fn(),
  getPrisonById: jest.fn(),
}

incidentClient.updateAgencyId = jest.fn()

let locationService

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  locationService = serviceCreator({ elite2ClientBuilder })
})

afterEach(() => {
  elite2Client.getPrisons.mockReset()
  elite2Client.getPrisonById.mockReset()
})

describe('locationService', () => {
  describe('getPrisons', () => {
    it('should return no prison', async () => {
      const prisons = ['hello']

      elite2Client.getPrisons.mockReturnValue(prisons)
      const result = await locationService.getPrisons(token)
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

      elite2Client.getPrisons.mockReturnValue(prisonsMock)
      const result = await locationService.getPrisons(token)
      expect(result).toEqual(prisonsInOrder)
    })
  })

  describe('updateAgencyId', () => {
    it('incidentClient.updateAgencyId should be called', async () => {
      await locationService.updateAgencyId('BXI', 'CA user', '1')
      expect(incidentClient.updateAgencyId).toBeCalledWith('BXI', 'CA user', '1')
    })
  })
})
