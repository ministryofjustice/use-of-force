import { NomisMappingClient } from '../data'
import NomisMappingService from './nomisMappingService'

const nomisMappingClient = new NomisMappingClient() as jest.Mocked<NomisMappingClient>
nomisMappingClient.getDpsLocationMappingUsingNomisLocationId = jest.fn()
let nomisMappingService

const token = 'token'
const nomisLocationId = 123456
const locationMappingDetail = {
  dpsLocationId: '00000000-1111-2222-3333-444444444444',
  nomisLocationId: 123456,
}

beforeEach(() => {
  nomisMappingService = new NomisMappingService(nomisMappingClient)
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
        nomisLocationId
      )

      expect(result).toEqual(locationMappingDetail)
      expect(nomisMappingClient.getDpsLocationMappingUsingNomisLocationId).toHaveBeenCalledWith(nomisLocationId, token)
    })
  })

  it('should return correct location details', async () => {
    const result = await nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId(
      token,
      nomisLocationId
    )

    expect(result).toEqual(locationMappingDetail)
  })
})
