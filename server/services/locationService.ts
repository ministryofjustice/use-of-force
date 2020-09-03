import { AgencyId, LocationService } from '../types/uof'
import logger from '../../log'
import { Elite2ClientBuilder } from '../data/elite2ClientBuilder'
import { Prison, PrisonLocation } from '../data/elite2ClientBuilderTypes'

export default function createLocationService(elite2ClientBuilder: Elite2ClientBuilder): LocationService {
  const getPrisons = async (token: string): Promise<Prison[]> => {
    const elite2Client = elite2ClientBuilder(token)
    const prisons = await elite2Client.getPrisons()
    logger.info('Retrieving all agencies from elite2')
    return prisons.sort((a, b) => a.description.localeCompare(b.description, 'en', { ignorePunctuation: true }))
  }

  const getPrisonById = async (token: string, prisonId: string): Promise<Prison> => {
    const elite2Client = elite2ClientBuilder(token)
    logger.info('Retrieving single prison from elite2')
    return elite2Client.getPrisonById(prisonId)
  }

  const getLocation = (token: string, locationId: number): Promise<PrisonLocation | Record<string, unknown>> => {
    if (!locationId) {
      return Promise.resolve({})
    }
    const elite2Client = elite2ClientBuilder(token)
    return elite2Client.getLocation(locationId)
  }

  const getIncidentLocations = async (token: string, agencyId: AgencyId): Promise<PrisonLocation[]> => {
    try {
      const elite2Client = elite2ClientBuilder(token)
      const incidentLocations = await elite2Client.getLocations(agencyId)

      const prisonersCell = incidentLocations.find(
        location => location.userDescription.toUpperCase() === "PRISONER'S CELL"
      )
      const otherCell = incidentLocations.find(location => location.userDescription.toUpperCase() === 'OTHER CELL')

      const remainingLocations = incidentLocations
        .filter(
          location =>
            location.userDescription.toUpperCase() !== 'OTHER CELL' &&
            location.userDescription.toUpperCase() !== "PRISONER'S CELL"
        )
        .sort((a, b) => a.userDescription.localeCompare(b.userDescription, 'en', { ignorePunctuation: true }))

      return [...(prisonersCell ? [prisonersCell] : []), ...(otherCell ? [otherCell] : []), ...remainingLocations]
    } catch (error) {
      logger.error(error, 'Error during getIncidentLocations')
      throw error
    }
  }

  return {
    getPrisons,
    getPrisonById,
    getLocation,
    getIncidentLocations,
  }
}
