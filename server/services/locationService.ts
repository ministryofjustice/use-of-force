import { AgencyId } from '../types/uof'
import logger from '../../log'
import { RestClientBuilder, PrisonClient } from '../data'
import { Prison, PrisonLocation } from '../data/prisonClientTypes'
import config from '../config'

export default class LocationService {
  constructor(private readonly prisonClientBuilder: RestClientBuilder<PrisonClient>) {}

  async getPrisons(token: string): Promise<Prison[]> {
    const prisonClient = this.prisonClientBuilder(token)
    const prisons = await prisonClient.getPrisons()
    return prisons.sort((a, b) => a.description.localeCompare(b.description, 'en', { ignorePunctuation: true }))
  }

  async getPrisonById(token: string, agencyId: AgencyId): Promise<Prison> {
    const prisonClient = this.prisonClientBuilder(token)
    return prisonClient.getPrisonById(agencyId)
  }

  async getLocation(token: string, locationId: number): Promise<string> {
    if (!locationId) {
      return ''
    }
    const prisonClient = this.prisonClientBuilder(token)
    const { userDescription, locationPrefix } = (await prisonClient.getLocation(locationId)) || {}
    return userDescription || locationPrefix || ''
  }

  async getIncidentLocations(token: string, agencyId: AgencyId): Promise<PrisonLocation[]> {
    try {
      const prisonClient = this.prisonClientBuilder(token)
      const incidentLocations = await prisonClient.getLocations(agencyId)
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
