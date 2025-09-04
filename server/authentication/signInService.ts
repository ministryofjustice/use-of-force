import log from '../../log'

export default function signInService() {
  return {
    getUser(token, username) {
      log.info(`User profile for: ${username}`)

      return {
        token,
        username,
      }
    },
  }
}
