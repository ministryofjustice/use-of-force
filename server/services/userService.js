const R = require('ramda')
const logger = require('../../log.js')
const { properCaseName } = require('../utils/utils.js')
const { usernamePattern } = require('../config/forms/validations')

/**
 * @returns {import('../types/uof').UserService}
 */
module.exports = function createUserService(elite2ClientBuilder, authClientBuilder) {
  const emailNotExistPromise = username => Promise.resolve({ username, exists: false, verified: false })

  return {
    async getUser(token) {
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
    },

    async getUsers(token, usernames) {
      try {
        if (!usernames) {
          return []
        }
        const client = authClientBuilder(token)

        const getEmailSafely = R.ifElse(R.test(usernamePattern), client.getEmail, emailNotExistPromise)

        const requests = usernames.map((username, i) => getEmailSafely(username).then(email => ({ ...email, i })))
        const responses = await Promise.all(requests)

        const missing = responses.filter(email => !email.exists)

        const usernamesForExisting = responses
          .filter(email => email.exists)
          .map(email => client.getUser(email.username).then(user => ({ ...user, ...email })))
        const existing = await Promise.all(usernamesForExisting)

        const results = [...existing, ...missing]
          .sort(({ i }, { i: j }) => i - j)
          .map(({ username, exists, verified, email, name, staffId }) => ({
            username,
            missing: !exists,
            verified,
            email,
            name,
            staffId,
          }))

        return results
      } catch (error) {
        logger.error('Error during getEmails: ', error.stack)
        throw error
      }
    },
  }
}
