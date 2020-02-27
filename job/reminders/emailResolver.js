class EmailResolver {
  constructor(authClientBuilder, systemToken, statementsClient) {
    this.authClientBuilder = authClientBuilder
    this.systemToken = systemToken
    this.statementsClient = statementsClient
  }

  async resolveEmail(transactionalClient, userId, reportId) {
    const authClient = this.authClientBuilder(await this.systemToken())
    const { verified, email } = await authClient.getEmail(userId)
    if (verified) {
      await this.statementsClient.setEmail(userId, reportId, email, transactionalClient)
      return email
    }
    return null
  }
}

module.exports = EmailResolver
