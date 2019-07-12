const logger = require('../../log.js')
const { isNilOrEmpty, properCaseName, formatDate } = require('../utils/utils')

module.exports = function createOffendersService(elite2ClientBuilder) {
  const getOffenderDetails = async (token, bookingId) => {
    try {
      const elite2Client = elite2ClientBuilder(token)
      const result = await elite2Client.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const locations = await elite2Client.getLocations(result.agencyId)

      const displayName = `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`

      const filteredLocations = locations.filter(
        agy => agy.userDescription && !['CELL', 'BOX'].includes(agy.locationType)
      )
      const { dateOfBirth } = result

      return {
        locations: filteredLocations,
        displayName,
        ...result,
        dateOfBirth: formatDate(dateOfBirth),
      }
    } catch (error) {
      logger.error(error, 'Error during getOffenderDetails')
      throw error
    }
  }

  const getOffenderImage = (token, bookingId) => {
    const elite2Client = elite2ClientBuilder(token)
    return elite2Client.getOffenderImage(bookingId)
  }

  return {
    getOffenderDetails,
    getOffenderImage,
  }
}
