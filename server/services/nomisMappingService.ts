import logger from '../../log'
import { RestClientBuilder, NomisMappingClient } from '../data'

export default class NomisMappingService {
  constructor(private readonly nomisMappingClientBuilder: RestClientBuilder<NomisMappingClient>) {}

  getDpsLocationDetailsHavingCorrespondingNomisLocationId(token, nomisLocationId: number) {
    const nomisMappingClient = this.nomisMappingClientBuilder(token)
    logger.info(`Service getting DpsLocationId associated with nomisLocationId: ${nomisLocationId}`)
    return nomisMappingClient.getDpsLocationMappingUsingNomisLocationId(nomisLocationId)
  }
}
