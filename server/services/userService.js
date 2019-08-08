const logger = require('../../log.js')
const { properCaseName } = require('../utils/utils.js')

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

  async function getEmails(token, usernames) {
    try {
      const client = authClientBuilder(token)
      const requests = usernames.map(username => client.getEmail(username))
      const responses = await Promise.all(requests)

      const missing = responses.filter(email => !email.exists)
      const notVerified = responses.filter(email => !email.verified)
      const exist = responses.filter(email => email.email)

      return {
        exist,
        missing,
        notVerified,
        success: missing.length === 0 && notVerified.length === 0,
      }
    } catch (error) {
      logger.error('Error during getEmails: ', error.stack)
      throw error
    }
  }

  return { getUser, getEmails }
}
