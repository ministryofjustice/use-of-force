const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const logger = require('../../log')
const config = require('../config')

const timeoutSpec = {
  response: config.apis.elite2.timeout.response,
  deadline: config.apis.elite2.timeout.deadline,
}
const apiUrl = config.apis.elite2.url

const agentOptions = {
  maxSockets: config.apis.elite2.agent.maxSockets,
  maxFreeSockets: config.apis.elite2.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.elite2.agent.freeSocketTimeout,
}

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

module.exports = token => {
  const userGet = userGetBuilder(token)
  return {
    async getOffenderDetails(bookingId) {
      const path = `${apiUrl}api/bookings/${bookingId}?basicInfo=false`
      return userGet({ path })
    },
    async getUser() {
      const path = `${apiUrl}api/users/me`
      return userGet({ path })
    },
    getUserCaseLoads() {
      const path = `${apiUrl}api/users/me/caseLoads`
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
        .agent(keepaliveAgent)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .query(query)
        .auth(token, { type: 'bearer' })
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
