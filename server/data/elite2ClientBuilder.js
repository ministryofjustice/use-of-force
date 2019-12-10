const superagent = require('superagent')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const { Readable } = require('stream')
const logger = require('../../log')
const config = require('../config')
const { getApiClientToken } = require('./authClientBuilder')

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

const systemTokenAcquirer = async username => {
  const { body } = await getApiClientToken(username)
  return body.access_token
}

module.exports = {
  systemElite2ClientBuilder: async (username, tokenAcquirer = systemTokenAcquirer) => {
    const token = await tokenAcquirer(username)
    const get = getBuilder(token)
    const stream = streamBuilder(token)
    const post = postBuilder(token)
    return {
      async getOffenders(offenderNos) {
        const path = `${apiUrl}/api/bookings/offenders`
        return post({ path, data: offenderNos })
      },
      getLocation(locationId) {
        const path = `${apiUrl}/api/locations/${locationId}`
        return get({ path })
      },
      getLocations(agencyId) {
        const path = `${apiUrl}/api/agencies/${agencyId}/locations`
        return get({ path, headers: { 'Sort-Fields': 'userDescription' } })
      },
      async getOffenderDetails(bookingId) {
        const path = `${apiUrl}/api/bookings/${bookingId}?basicInfo=false`
        return get({ path })
      },
      getOffenderImage(bookingId) {
        const path = `${apiUrl}/api/bookings/${bookingId}/image/data`
        return stream({
          path,
          logger: error =>
            error.status === 404
              ? logger.info(`No offender image available for: ${bookingId}`)
              : defaultErrorLogger(error),
        })
      },
    }
  },

  userElite2ClientBuilder: token => {
    const get = getBuilder(token)
    const stream = streamBuilder(token)
    return {
      async getUser() {
        const path = `${apiUrl}/api/users/me`
        return get({ path })
      },
      getUserCaseLoads() {
        const path = `${apiUrl}/api/users/me/caseLoads`
        return get({ path })
      },
      getLocations(agencyId) {
        const path = `${apiUrl}/api/agencies/${agencyId}/locations`
        return get({ path, headers: { 'Sort-Fields': 'userDescription' } })
      },
      async getOffenderDetails(bookingId) {
        const path = `${apiUrl}/api/bookings/${bookingId}?basicInfo=false`
        return get({ path })
      },
      getOffenderImage(bookingId) {
        const path = `${apiUrl}/api/bookings/${bookingId}/image/data`
        return stream({
          path,
          logger: error =>
            error.status === 404
              ? logger.info(`No offender image available for: ${bookingId}`)
              : defaultErrorLogger(error),
        })
      },
    }
  },
}

function getBuilder(token) {
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

function postBuilder(token) {
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

function streamBuilder(token) {
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
