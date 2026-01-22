import logger from '../../log'
import { NonResidentialServiceType } from '../config/types'

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
      if (error?.status !== 404) throw error
    }
    return undefined
  }

  async getLocations(
    prisonId: string,
    token: string,
    serviceType: NonResidentialServiceType = NonResidentialServiceType.USE_OF_FORCE
  ): Promise<LocationInPrison[]> {
    logger.info(`getting locations for prison ${prisonId} and serviceType ${serviceType}`)
    return LocationClient.restClient(token).get({
      path: `/locations/non-residential/prison/${prisonId}/service/${serviceType}?formatLocalName=true&sortByLocalName=true`,
    })
  }
}
