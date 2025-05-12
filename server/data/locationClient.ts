import logger from '../../log'
import { NonResidentialUsageType } from '../config/types'

import BaseApiClient from './baseApiClient'
import config from '../config'
import { LocationInPrison } from '../types/locationsApi/locationsInPrisonTypes'

export default class LocationClient extends BaseApiClient {
  protected static config() {
    return config.apis.location
  }

  async getLocation(incidentLocationId: string, token: string): Promise<LocationInPrison> {
    if (incidentLocationId.length !== 36) {
      logger.info(`locationId ${incidentLocationId} has invalid length for UUID`)
      return undefined
    }
    try {
      logger.info(`Location Client getting details for location: ${incidentLocationId}`)
      const result = await LocationClient.restClient(token).get({
        path: `/locations/${incidentLocationId}?formatLocalName=true`,
      })
      return result as LocationInPrison
    } catch (error) {
      console.log(error)
      if (error?.status !== 404) throw error
    }
    return undefined
  }

  async getLocations(
    prisonId: string,
    token: string,
    usageType: NonResidentialUsageType = NonResidentialUsageType.OCCURRENCE
  ): Promise<LocationInPrison[]> {
    logger.info(`getting locations for prison ${prisonId} and usageType ${usageType}`)
    return LocationClient.restClient(token).get({
      path: `/locations/prison/${prisonId}/non-residential-usage-type/${usageType}?formatLocalName=true&sortByLocalName=true`,
    })
  }
}
