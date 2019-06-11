const log = require('../../log')

function signInService() {
  return {
    getUser(token, refreshToken, expiresIn, username) {
      log.info(`User profile for: ${username}`)

      return {
        token,
        refreshToken,
        refreshTime: getRefreshTime(expiresIn),
        username,
      }
    },
  }

  function getRefreshTime(expiresIn) {
    // arbitrary five minute before expiry time
    const now = new Date()
    const secondsUntilExpiry = now.getSeconds() + (expiresIn - 300)
    return now.setSeconds(secondsUntilExpiry)
  }
}

module.exports = signInService
