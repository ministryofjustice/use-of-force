const logger = require('../../log.js')
const { isNilOrEmpty, properCaseName } = require('../utils/utils')

module.exports = function createOffendersService(nomisClientBuilder) {
  async function getOffenderDetails(token, bookingId) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const result = await nomisClient.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const displayName = {
        displayName: `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`,
      }

      return {
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
