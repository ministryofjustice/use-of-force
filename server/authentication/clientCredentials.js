const querystring = require('querystring')
const { getNamespace } = require('cls-hooked')
const superagent = require('superagent')
const logger = require('../../log')
const config = require('../config')

module.exports = {
  generateOauthClientToken,
  getApiClientToken,
  generate,
}

const oauthUrl = `${config.apis.oauth2.url}/oauth/token`
const timeoutSpec = {
  response: config.apis.oauth2.timeout.response,
  deadline: config.apis.oauth2.timeout.deadline,
}

function generateOauthClientToken(
  clientId = config.apis.oauth2.apiClientId,
  clientSecret = config.apis.oauth2.apiClientSecret
) {
  return generate(clientId, clientSecret)
}

function generate(clientId, clientSecret) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}

async function getApiClientToken() {
  const clientToken = generateOauthClientToken()
  const handle = getNamespace('request.scope')
  const username = handle.get('user')
  const correlationId = handle.get('correlationId')
  const oauthRequest = querystring.stringify({ grant_type: 'client_credentials', username })

  logger.info(
    `Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.apiClientId}' and user '${username}'`
  )

  return superagent
    .post(oauthUrl)
    .set('Authorization', clientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .set('correlationId', correlationId)
    .send(oauthRequest)
    .timeout(timeoutSpec)
}
