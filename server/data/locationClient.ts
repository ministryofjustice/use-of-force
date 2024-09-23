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
    try {
      logger.info(`Location Client getting details for location: ${incidentLocationId}`)
      const result = await this.restClient.get({ path: `/locations/${incidentLocationId}` })
      return result as LocationInPrison
    } catch (error) {
      if (error?.status !== 404) throw error
    }
    return undefined
  }

  async getLocations(
    prisonId: string,
    usageType: NonResidentialUsageType = NonResidentialUsageType.OCCURRENCE
  ): Promise<LocationInPrison[]> {
    logger.info(`getting locations for prison ${prisonId} and usageType ${usageType}`)
    return this.restClient.get({
      path: `/locations/prison/${prisonId}/non-residential-usage-type/${usageType}`,
      headers: { 'Sort-Fields': 'userDescription' },
    })
  }
}
