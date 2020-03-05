const logger = require('../../log')

class EmailResolver {
  constructor(authClientBuilder, systemToken, statementsClient) {
    this.authClientBuilder = authClientBuilder
    this.systemToken = systemToken
    this.statementsClient = statementsClient
  }

  async resolveEmail(transactionalClient, userId, reportId) {
    logger.info(`Checking to see if previously unverified user: ${userId} now has verified email for statement`)

    const authClient = this.authClientBuilder(await this.systemToken())
    const { verified, email } = await authClient.getEmail(userId)
    if (verified) {
      logger.info('Found verified email')
      await this.statementsClient.setEmail(userId, reportId, email, transactionalClient)
      return true
    }
    logger.info(`User still not verified`)

    return false
  }
}

module.exports = EmailResolver
