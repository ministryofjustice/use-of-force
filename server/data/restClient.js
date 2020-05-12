const superagent = require('superagent')
/** @type {any} */
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const { Readable } = require('stream')
const logger = require('../../log')

module.exports = (name, config) => {
  const timeoutSpec = {
    response: config.timeout.response,
    deadline: config.timeout.deadline,
  }
  const apiUrl = config.url

  const agentOptions = {
    maxSockets: config.agent.maxSockets,
    maxFreeSockets: config.agent.maxFreeSockets,
    freeSocketTimeout: config.agent.freeSocketTimeout,
  }

  const agent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

  const defaultErrorLogger = error => logger.warn(error, `Error calling ${name}`)

  return token => ({
    async get({ path = null, query = '', headers = {}, responseType = '', raw = false } = {}) {
      logger.info(`Get using user credentials: calling ${name}: ${path} ${query}`)
      try {
        const result = await superagent
          .get(`${apiUrl}${path}`)
          .agent(agent)
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
        const response = error.response && error.response.text
        logger.warn(
          `Error calling ${name}, path: '${path}', verb: 'GET', query: '${query}', response: '${response}'`,
          error.stack
        )
        throw error
      }
    },

    async post({ path = null, headers = {}, responseType = '', data = {}, raw = false } = {}) {
      logger.info(`Post using user credentials: calling ${name}: ${path}`)
      try {
        const result = await superagent
          .post(`${apiUrl}${path}`)
          .send(data)
          .agent(agent)
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
        const response = error.response && error.response.text
        logger.warn(
          `Error calling ${name}, path: '${path}', verb: 'GET', query: 'POST', response: '${response}'`,
          error.stack
        )
        throw error
      }
    },

    stream({ path, headers = {}, errorLogger = defaultErrorLogger }) {
      logger.info(`Get using user credentials: calling ${name}: ${path}`)
      return new Promise((resolve, reject) => {
        superagent
          .get(`${apiUrl}${path}`)
          .agent(agent)
          .auth(token, { type: 'bearer' })
          .retry(2, (err, res) => {
            if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
            return undefined // retry handler only for logging retries, not to influence retry logic
          })
          .timeout(timeoutSpec)
          .set(headers)
          .end((error, response) => {
            if (error) {
              errorLogger(error)
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
    },
  })
}
