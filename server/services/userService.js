const R = require('ramda')
const logger = require('../../log.js')
const { properCaseName } = require('../utils/utils.js')
const { usernamePattern } = require('../config/forms/validations')

module.exports = function createUserService(elite2ClientBuilder, authClientBuilder) {
  async function getUser(token) {
    try {
      const elite2Client = elite2ClientBuilder(token)
      const user = await elite2Client.getUser()

      const activeCaseLoads = user.activeCaseLoadId ? await elite2Client.getUserCaseLoads() : []
      const activeCaseLoad = activeCaseLoads.find(caseLoad => caseLoad.caseLoadId === user.activeCaseLoadId)

      return {
        ...user,
        displayName: `${properCaseName(user.firstName)} ${properCaseName(user.lastName)}`,
        activeCaseLoad,
      }
    } catch (error) {
      logger.error('Error during getUser: ', error.stack)
      throw error
    }
  }

  const emailNotExistPromise = username => Promise.resolve({ username, exists: false, verified: false })

  async function getUsers(token, usernames) {
    try {
      const client = authClientBuilder(token)

      const getEmailSafely = R.ifElse(R.test(usernamePattern), client.getEmail, emailNotExistPromise)

      const requests = usernames.map((username, i) => getEmailSafely(username).then(email => ({ ...email, i })))
      const responses = await Promise.all(requests)

      const missing = responses.filter(email => !email.exists)
      const notVerified = responses.filter(email => email.exists && !email.verified)
      const usernamesForExisting = responses
        .filter(email => email.email)
        .map(email => client.getUser(email.username).then(user => ({ ...user, ...email })))

      const exist = await Promise.all(usernamesForExisting)

      return {
        exist,
        missing,
        notVerified,
        success: notVerified.length === 0,
      }
    } catch (error) {
      logger.error('Error during getEmails: ', error.stack)
      throw error
    }
  }

  return { getUser, getUsers }
}
