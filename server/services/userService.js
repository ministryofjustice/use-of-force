const logger = require('../../log.js')
const { properCaseName } = require('../utils/utils.js')

module.exports = function createUserService(elite2ClientBuilder) {
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

  return { getUser }
}
