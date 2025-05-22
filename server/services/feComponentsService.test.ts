import FeComponentsService from './feComponentsService'
import { FeComponentsClient } from '../data'
import { FeComponentsResponse } from '../data/feComponentsClient'

jest.mock('../data/feComponentsClient')

const token = 'some token'

describe('Components service', () => {
  let componentsClient: jest.Mocked<FeComponentsClient>
  let componentsService: FeComponentsService

  describe('getComponent', () => {
    beforeEach(() => {
      componentsClient = jest.mocked(new FeComponentsClient())
      componentsService = new FeComponentsService(componentsClient)
    })

    it('Retrieves and returns requested component', async () => {
      const caseLoad = {
        caseLoadId: 'TST',
        description: 'Leeds (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      }

      const componentValue: FeComponentsResponse = {
        header: {
          html: '<header></header>',
          css: [],
          javascript: [],
        },
        footer: {
          html: '<footer></footer>',
          css: [],
          javascript: [],
        },
        meta: {
          activeCaseLoad: caseLoad,
          caseLoads: [caseLoad],
          services: [],
        },
      }

      componentsClient.getComponents.mockResolvedValue(componentValue)

      const result = await componentsService.getFeComponents(['header'], token)

      expect(result).toEqual(componentValue)
    })

    it('Propagates error', async () => {
      componentsClient.getComponents.mockRejectedValue(new Error('some error'))

      await expect(componentsService.getFeComponents(['header'], token)).rejects.toEqual(new Error('some error'))
    })
  })
})
