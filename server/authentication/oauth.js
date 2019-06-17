const config = require('../config')

function generateOauthClientToken() {
  return generate(config.nomis.apiClientId, config.nomis.apiClientSecret)
}

function generate(clientId, clientSecret) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  return `Basic ${token}`
}

module.exports = {
  generateOauthClientToken,
  generate,
}
