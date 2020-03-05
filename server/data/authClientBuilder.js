const superagent = require('superagent')
/** @type {any} */
const Agent = require('agentkeepalive')
const querystring = require('querystring')
const { HttpsAgent } = require('agentkeepalive')
const logger = require('../../log')
const config = require('../config')
const { generateOauthClientToken } = require('../authentication/clientCredentials')

const timeoutSpec = {
  response: config.apis.oauth2.timeout.response,
  deadline: config.apis.oauth2.timeout.deadline,
}
const apiUrl = config.apis.oauth2.url

const agentOptions = {
  maxSockets: config.apis.oauth2.agent.maxSockets,
  maxFreeSockets: config.apis.oauth2.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.oauth2.agent.freeSocketTimeout,
}

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

module.exports = {
  authClientBuilder(token) {
    const get = getBuilder(token)
    return {
      async getEmail(username) {
        const path = `${apiUrl}/api/user/${username}/email`
        const { status, body } = await get({ path, raw: true })
        return {
          email: body.email,
          username: body.username || username,
          exists: status < 400,
          verified: status === 200,
        }
      },
      async getUser(username) {
        const path = `${apiUrl}/api/user/${username}`
        const body = await get({ path })
        return body
      },
    }
  },

  async systemToken(username) {
    const systemClientToken = await getSystemClientToken(username)
    return systemClientToken.access_token
  },
}

async function getSystemClientToken(username) {
  const clientToken = generateOauthClientToken(config.apis.oauth2.systemClientId, config.apis.oauth2.systemClientSecret)

  const oauthRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  logger.info(
    `Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.apiClientId}' and user '${username}'`
  )

  const result = await superagent
    .post(`${apiUrl}/oauth/token`)
    .set('Authorization', clientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec)
  return result.body
}

function getBuilder(token) {
  return async ({ path = null, query = '', headers = {}, responseType = '', raw = false } = {}) => {
    logger.info(`Get using user credentials: calling elite2api: ${path} ${query}`)
    try {
      const result = await superagent
        .get(path)
        .ok(res => [200, 204, 404].includes(res.status))
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
      logger.warn(error, `Error calling auth: ${path}`)
      throw error
    }
  }
}
