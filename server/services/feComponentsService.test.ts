import { FeComponentsClient } from '../data'
import { AvailableComponent, Component } from '../data/feComponentsClient'
import FeComponentsService from './feComponentsService'

jest.mock('../data')

const FeComponentsClientBuilder = jest.fn()
const token = 'token'
const components = ['header', 'footer']
const feComponentsClient = new FeComponentsClient(null) as jest.Mocked<FeComponentsClient>
let feComponentsService

beforeEach(() => {
  FeComponentsClientBuilder.mockReturnValue(feComponentsClient)
  feComponentsService = new FeComponentsService(FeComponentsClientBuilder)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('feComponentsService', () => {
  describe('getFeComponents', () => {
    it('should use token', async () => {
      feComponentsClient.getComponents.mockResolvedValue({} as Record<AvailableComponent, Component>)

      await feComponentsService.getFeComponents(components, token)
      expect(FeComponentsClientBuilder).toHaveBeenCalledWith(token)
    })
    it('should call upstream client correctly', async () => {
      const response = {
        header: {
          html: '',
          css: [],
          javascript: [],
        },
        footer: {
          html: '',
          css: [],
          javascript: [],
        },
      }
      feComponentsClient.getComponents.mockResolvedValue(response)
      const result = await feComponentsService.getFeComponents(components, token)
      expect(result).toEqual(response)
    })
  })
})
