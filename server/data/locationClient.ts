// @ts-nocheck
import logger from '../../log'
import type { RestClient } from './restClient'
import type { LocationInPrison } from './locationClientTypes'
import { NonResidentialUsageType } from '../config/types'

export default class LocationClient {
  constructor(private restClient: RestClient) {}

  async getLocation(incidentLocationId: string): Promise<LocationInPrison> {
    if (incidentLocationId.length !== 36) {
      logger.info(`locationId ${incidentLocationId} has invalid length for UUID`)
      return undefined
    }
      logger.info(`Location Client getting details for location: ${incidentLocationId}`)
      return this.restClient.get({ path: `/locations/${incidentLocationId}?formatLocalName=true` })
  }

  async getLocations(
    prisonId: string,
    usageType: NonResidentialUsageType = NonResidentialUsageType.OCCURRENCE
  ): Promise<LocationInPrison[]> {
    logger.info(`Location Client getting locations for prison ${prisonId} and usageType ${usageType}`)
    return this.restClient.get({
      path: `/locations/prison/${prisonId}/non-residential-usage-type/${usageType}?formatLocalName=true&sortByLocalName=true`,
    })
  }
}
