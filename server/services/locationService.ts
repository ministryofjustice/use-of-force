import { AgencyId } from '../types/uof'
import logger from '../../log'
import { Prison, PrisonLocation } from '../data/prisonClientTypes'
import config from '../config'
import { LocationClient, PrisonClient } from '../data'

export default class LocationService {
  constructor(private readonly prisonClient: PrisonClient, private readonly locationClient: LocationClient) {}

  mapLocationApiResponse(location) {
    return {
      incidentLocationId: location.id,
      description: location.pathHierarchy,
      agencyId: location.prisonId,
      locationPrefix: location.key,
      userDescription: location.localName,
    } as PrisonLocation
  }

  async getPrisons(token: string): Promise<Prison[]> {
    const prisons = await this.prisonClient.getPrisons(token)
    return prisons.sort((a, b) => a.description.localeCompare(b.description, 'en', { ignorePunctuation: true }))
  }

  async getPrisonById(token: string, agencyId: AgencyId): Promise<Prison> {
    return this.prisonClient.getPrisonById(agencyId, token)
  }

  async getLocation(token: string, incidentLocationId: string): Promise<string> {
    if (!incidentLocationId) {
      return ''
    }

    const { localName, pathHierarchy } = (await this.locationClient.getLocation(incidentLocationId, token)) || {}
    return localName || pathHierarchy || ''
  }

  async getIncidentLocations(token: string, agencyId: AgencyId): Promise<PrisonLocation[]> {
    try {
      const locations = await this.locationClient.getLocations(agencyId, token, undefined)
      const incidentLocations = locations.map(location => this.mapLocationApiResponse(location))

      const formattedIncidentLocations = incidentLocations.map(location => ({
        ...location,
        userDescription: location.userDescription ? location.userDescription : location.locationPrefix,
      }))

      const prisonersCell = formattedIncidentLocations.find(
        location => location.userDescription.toUpperCase() === "PRISONER'S CELL"
      )
      const otherCell = formattedIncidentLocations.find(
        location => location.userDescription.toUpperCase() === 'OTHER CELL'
      )
      const inCell = formattedIncidentLocations.find(location => location.userDescription.toUpperCase() === 'IN CELL')

      const remainingLocations = formattedIncidentLocations
        .filter(
          location =>
            location.userDescription.toUpperCase() !== 'OTHER CELL' &&
            location.userDescription.toUpperCase() !== "PRISONER'S CELL" &&
            location.userDescription.toUpperCase() !== 'IN CELL'
        )
        .sort((a, b) => a.userDescription.localeCompare(b.userDescription, 'en', { ignorePunctuation: true }))
      if (config.featureFlagRemoveCellLocationAgencies.includes(agencyId)) {
        return remainingLocations
      }
      return [
        ...(prisonersCell ? [prisonersCell] : []),
        ...(otherCell ? [otherCell] : []),
        ...(inCell ? [inCell] : []),
        ...remainingLocations,
      ]
    } catch (error) {
      logger.error(error, 'Error during getIncidentLocations')
      throw error
    }
  }
}
