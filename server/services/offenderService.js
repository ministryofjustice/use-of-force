const logger = require('../../log.js')
const { isNilOrEmpty, properCaseName } = require('../utils/utils')
const locationsFilter = require('./locationsFilter')

module.exports = function createOffendersService(userElite2ClientBuilder, systemElite2ClientBuilder) {
  const getOffenderDetailsForUser = async (token, bookingId) => {
    try {
      const elite2Client = userElite2ClientBuilder(token)
      const result = await elite2Client.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const unfilteredLocations = await elite2Client.getLocations(result.agencyId)
      const locations = locationsFilter(unfilteredLocations)

      const displayName = `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`

      const { dateOfBirth } = result

      return {
        locations,
        displayName,
        ...result,
        dateOfBirth,
      }
    } catch (error) {
      logger.error(error, 'Error during getOffenderDetails')
      throw error
    }
  }

  const getOffenderDetails = async (username, bookingId) => {
    try {
      const elite2Client = await systemElite2ClientBuilder(username)
      const result = await elite2Client.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const unfilteredLocations = await elite2Client.getLocations(result.agencyId)
      const locations = locationsFilter(unfilteredLocations)

      const displayName = `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`

      const { dateOfBirth } = result

      return {
        locations,
        displayName,
        ...result,
        dateOfBirth,
      }
    } catch (error) {
      logger.error(error, 'Error during getOffenderDetails')
      throw error
    }
  }

  const getOffenderImage = async (user, bookingId) => {
    if (user.isReviewer) {
      const systemElite2Client = await systemElite2ClientBuilder(user.username)
      return systemElite2Client.getOffenderImage(bookingId)
    }

    const elite2Client = userElite2ClientBuilder(user.token)
    return elite2Client.getOffenderImage(bookingId)
  }

  const fullName = ({ firstName, lastName }) => `${properCaseName(lastName)}, ${properCaseName(firstName)}`

  const getOffenderNames = async (username, offenderNos) => {
    if (offenderNos.length === 0) {
      return {}
    }
    const uniqueNos = [...new Set(offenderNos)]
    const client = await systemElite2ClientBuilder(username)
    const offenders = await client.getOffenders(uniqueNos)
    return offenders.reduce((rv, offender) => ({ ...rv, [offender.offenderNo]: fullName(offender) }), {})
  }

  const getLocation = async (username, locationId) => {
    if (!locationId) {
      return {}
    }
    const elite2Client = await systemElite2ClientBuilder(username)
    return elite2Client.getLocation(locationId)
  }

  return {
    getOffenderDetails,
    getOffenderDetailsForUser,
    getOffenderImage,
    getOffenderNames,
    getLocation,
  }
}
