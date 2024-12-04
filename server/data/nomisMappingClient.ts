import logger from '../../log'
import type { RestClient } from './restClient'
import type { LocationMapping } from './nomisMappingClientTypes'

export default class NomisMappingClient {
  constructor(private restClient: RestClient) {}

  async getDpsLocationMappingUsingNomisLocationId(nomisLocationId: number): Promise<LocationMapping> {
    logger.info(`Nomis mapping api client getting DPS location details using this nomisLocationId: ${nomisLocationId}`)
    return this.restClient.get({ path: `/api/locations/nomis/${nomisLocationId}` })
  }
}
