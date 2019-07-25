const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const { Readable } = require('stream')
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

const defaultErrorLogger = error => logger.warn(error, 'Error calling elite2api')

module.exports = token => {
  const userGet = userGetBuilder(token)
  const userStream = userStreamBuilder(token)
  const userPost = userPostBuilder(token)
  return {
    async getOffenderDetails(bookingId) {
      const path = `${apiUrl}/api/bookings/${bookingId}?basicInfo=false`
      return userGet({ path })
    },
    async getOffenders(offenderNos) {
      const path = `${apiUrl}/api/bookings/offenders`
      return userPost({ path, data: offenderNos })
    },
    async getUser() {
      const path = `${apiUrl}/api/users/me`
      return userGet({ path })
    },
    getUserCaseLoads() {
      const path = `${apiUrl}/api/users/me/caseLoads`
      return userGet({ path })
    },
    getLocations(agencyId) {
      const path = `${apiUrl}/api/agencies/${agencyId}/locations`
      return userGet({ path, headers: { 'Sort-Fields': 'userDescription' } })
    },
    getOffenderImage(bookingId) {
      const path = `${apiUrl}/api/bookings/${bookingId}/image/data`
      return userStream({
        path,
        logger: error =>
          error.status === 404
            ? logger.info(`No offender image available for: ${bookingId}`)
            : defaultErrorLogger(error),
      })
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

function userPostBuilder(token) {
  return async ({ path, headers = {}, responseType = '', data = {}, raw = false } = {}) => {
    logger.info(`Get using user credentials: calling elite2api: ${path}`)
    try {
      const result = await superagent
        .post(path)
        .send(data)
        .agent(keepaliveAgent)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
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

function userStreamBuilder(token) {
  return ({ path, headers = {}, errorLogger = defaultErrorLogger }) => {
    logger.info(`Get using user credentials: calling elite2api: ${path}`)
    return new Promise((resolve, reject) => {
      superagent
        .get(path)
        .agent(keepaliveAgent)
        .auth(token, { type: 'bearer' })
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .timeout(timeoutSpec)
        .set(headers)
        .end((error, response) => {
          if (error) {
            errorLogger(error, response)
            reject(error)
          } else if (response) {
            const s = new Readable()
            // eslint-disable-next-line no-underscore-dangle
            s._read = () => {}
            s.push(response.body)
            s.push(null)
            resolve(s)
          }
        })
    })
  }
}
