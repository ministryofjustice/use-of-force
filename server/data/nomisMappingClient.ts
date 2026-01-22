import logger from '../../log'
import type { LocationMapping } from './nomisMappingClientTypes'
import BaseApiClient from './baseApiClient'
import config from '../config'

export default class NomisMappingClient extends BaseApiClient {
  protected static config() {
    return config.apis.nomisMapping
  }

  async getDpsLocationMappingUsingNomisLocationId(nomisLocationId: number, token: string): Promise<LocationMapping> {
    logger.info(`Nomis mapping api client getting DPS location details using this nomisLocationId: ${nomisLocationId}`)
    return NomisMappingClient.restClient(token).get({ path: `/api/locations/nomis/${nomisLocationId}` })
  }
}
