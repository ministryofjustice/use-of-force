import logger from '../../log'
import { isNilOrEmpty, properCaseName } from '../utils/utils'
import { AgencyId, OffenderService, PrisonerDetail, PrisonLocation } from '../types/uof'

const compare = (a, b): number => {
  let comparison = 0
  if (a.userDescription.toUpperCase() > b.userDescription.toUpperCase()) {
    comparison = 1
  } else if (a.userDescription.toUpperCase() < b.userDescription.toUpperCase()) {
    comparison = -1
  }
  return comparison
}

export default function createOffenderService(elite2ClientBuilder): OffenderService {
  const getOffenderDetails = async (token, bookingId): Promise<object> => {
    try {
      const elite2Client = elite2ClientBuilder(token)
      const result = await elite2Client.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const displayName = `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`
      const { dateOfBirth } = result

      return {
        displayName,
        ...result,
        dateOfBirth,
      }
    } catch (error) {
      logger.error(error, 'Error during getOffenderDetails')
      throw error
    }
  }

  const getPrisonersDetails = async (token: string, offenderNumbers: string[]): Promise<Array<PrisonerDetail>> => {
    try {
      const elite2Client = elite2ClientBuilder(token)
      const result = await elite2Client.getPrisoners(offenderNumbers)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for offenderNumbers ${offenderNumbers}`)
        return []
      }
      return result
    } catch (error) {
      logger.error(error, 'Error during getPrisonersDetails')
      throw error
    }
  }

  const getOffenderImage = (token, bookingId): Promise<ReadableStream> => {
    const elite2Client = elite2ClientBuilder(token)
    return elite2Client.getOffenderImage(bookingId)
  }

  const fullName = ({ firstName, lastName }): string => `${properCaseName(lastName)}, ${properCaseName(firstName)}`

  const getOffenderNames = async (token, offenderNos): Promise<{ [offenderNo: string]: string }> => {
    if (offenderNos.length === 0) {
      return {}
    }
    const uniqueNos = [...new Set(offenderNos)]
    const offenders = await elite2ClientBuilder(token).getOffenders(uniqueNos)

    return offenders.reduce((rv, offender) => ({ ...rv, [offender.offenderNo]: fullName(offender) }), {})
  }

  const getLocation = (token: string, locationId: string): Promise<PrisonLocation> => {
    if (!locationId) {
      return Promise.resolve({})
    }
    const elite2Client = elite2ClientBuilder(token)
    return elite2Client.getLocation(locationId)
  }

  const getIncidentLocations = async (token: string, agencyId: AgencyId): Promise<PrisonLocation[]> => {
    try {
      const incidentLocations = elite2ClientBuilder(token).getLocations(agencyId)

      const primaryLocations = incidentLocations.filter(
        loc =>
          loc.userDescription.toUpperCase() === "PRISONER'S CELL" || loc.userDescription.toUpperCase() === 'OTHER CELL'
      )
      const remainingLocations = incidentLocations
        .filter(
          loc =>
            loc.userDescription.toUpperCase() !== "PRISONER'S CELL" &&
            loc.userDescription.toUpperCase() !== 'OTHER CELL'
        )
        .sort(compare)

      if (primaryLocations.length === 2 && primaryLocations[0].userDescription.toUpperCase() !== "PRISONER'S CELL") {
        primaryLocations.reverse()
      }

      return [...primaryLocations, ...remainingLocations]
    } catch (error) {
      logger.error(error, 'Error during getIncidentLocations')
      throw error
    }
  }

  return {
    getOffenderDetails,
    getPrisonersDetails,
    getOffenderImage,
    getOffenderNames,
    getLocation,
    getIncidentLocations,
  }
}
