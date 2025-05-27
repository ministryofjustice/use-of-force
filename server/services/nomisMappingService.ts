import logger from '../../log'
import { NomisMappingClient } from '../data'

export default class NomisMappingService {
  constructor(private readonly nomisMappingClient: NomisMappingClient) {}

  getDpsLocationDetailsHavingCorrespondingNomisLocationId(token: string, nomisLocationId: number) {
    logger.info(`Service getting DpsLocationId associated with nomisLocationId: ${nomisLocationId}`)
    return this.nomisMappingClient.getDpsLocationMappingUsingNomisLocationId(nomisLocationId, token)
  }
}
