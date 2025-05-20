import { NomisMappingClient } from '../data'
import NomisMappingService from './nomisMappingService'

const nomisMappingClient = new NomisMappingClient(null) as jest.Mocked<NomisMappingClient>
nomisMappingClient.getDpsLocationMappingUsingNomisLocationId = jest.fn()
const nomisMappingClientBuilder = jest.fn()
let nomisMappingService

const token = 'token'
const nomisLocationId = 123456
const locationMappingDetail = {
  dpsLocationId: '00000000-1111-2222-3333-444444444444',
  nomisLocationId: 123456,
}

beforeEach(() => {
  nomisMappingClientBuilder.mockReturnValue(nomisMappingClient)
  nomisMappingService = new NomisMappingService(nomisMappingClientBuilder)
  nomisMappingClient.getDpsLocationMappingUsingNomisLocationId.mockResolvedValue(locationMappingDetail)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('nomisMappingService', () => {
  describe('getDpsLocationDetailsHavingCorrespondingNomisLocationId', () => {
    it('should call api client with correct details', async () => {
      const result = await nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId(
        token,
        nomisLocationId,
      )

      expect(result).toEqual(locationMappingDetail)
      expect(nomisMappingClient.getDpsLocationMappingUsingNomisLocationId).toHaveBeenCalledWith(nomisLocationId)
    })
  })

  it('should return correct location details', async () => {
    const result = await nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId(
      token,
      nomisLocationId,
    )

    expect(result).toEqual(locationMappingDetail)
  })
})
