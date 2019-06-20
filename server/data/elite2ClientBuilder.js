const superagent = require('superagent')
const logger = require('../../log')
const config = require('../config')

const timeoutSpec = {
  response: config.apis.elite2.timeout.response,
  deadline: config.apis.elite2.timeout.deadline,
}
const apiUrl = config.apis.elite2.url
module.exports = token => {
  const userGet = userGetBuilder(token)
  return {
    async getOffenderDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}?basicInfo=false`
      return userGet({ path })
    },
  }
}
function userGetBuilder(token) {
  return async ({ path, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    logger.info(`Get using user credentials: calling elite2api: ${path} ${query}`)
    try {
      const result = await superagent
        .get(path)
        .query(query)
        .set('Authorization', `Bearer ${token}`)
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return raw ? result : result.body
    } catch (error) {
      logger.warn(error, 'Error calling elite2api')
      throw error
    }
  }
}
