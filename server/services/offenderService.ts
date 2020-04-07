import logger from '../../log'
import { isNilOrEmpty, properCaseName } from '../utils/utils'
import { PrisonerDetail } from '../types/uof'

export default function createOffenderService(elite2ClientBuilder) {
  const getOffenderDetails = async (token, bookingId) => {
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

  const getPrisonersDetails = async (token: string, offenderNumbers: [string]): Promise<Array<PrisonerDetail>> => {
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

  const getOffenderImage = (token, bookingId) => {
    const elite2Client = elite2ClientBuilder(token)
    return elite2Client.getOffenderImage(bookingId)
  }

  const fullName = ({ firstName, lastName }) => `${properCaseName(lastName)}, ${properCaseName(firstName)}`

  const getOffenderNames = async (token, offenderNos) => {
    if (offenderNos.length === 0) {
      return {}
    }
    const uniqueNos = [...new Set(offenderNos)]
    const offenders = await elite2ClientBuilder(token).getOffenders(uniqueNos)
    return offenders.reduce((rv, offender) => ({ ...rv, [offender.offenderNo]: fullName(offender) }), {})
  }

  const getLocation = (token, locationId) => {
    if (!locationId) {
      return {}
    }
    const elite2Client = elite2ClientBuilder(token)
    return elite2Client.getLocation(locationId)
  }

  const getIncidentLocations = async (token, agencyId) => {
    try {
      const elite2Client = elite2ClientBuilder(token)

      return elite2Client.getLocations(agencyId)
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