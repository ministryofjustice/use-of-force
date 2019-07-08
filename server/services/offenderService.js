const logger = require('../../log.js')
const { isNilOrEmpty, properCaseName } = require('../utils/utils')

module.exports = function createOffendersService(elite2ClientBuilder) {
  async function getOffenderDetails(token, bookingId) {
    try {
      const elite2Client = elite2ClientBuilder(token)
      const result = await elite2Client.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const locations = await elite2Client.getLocations(result.agencyId)

      const displayName = {
        displayName: `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`,
      }

      const filteredLocations = locations.filter(
        agy => agy.userDescription && !['CELL', 'BOX'].includes(agy.locationType)
      )

      return {
        locations: filteredLocations,
        ...result,
        ...displayName,
      }
    } catch (error) {
      logger.error(error, 'Error during getOffenderDetails')
      throw error
    }
  }

  return {
    getOffenderDetails,
  }
}
