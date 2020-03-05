module.exports = function createReviewService({ statementsClient, incidentClient, authClientBuilder }) {
  /**
   * @param {string} token
   * @param {any[]} statements
   * @return {Promise<any[]>}
   */
  const statementsWithVerifiedInfo = async (token, statements) => {
    const authClient = authClientBuilder(token)
    const results = statements.map(statement =>
      authClient.getEmail(statement.userId).then(email => ({ ...statement, isVerified: email.verified }))
    )
    return Promise.all(results)
  }

  return {
    getReport: async reportId => {
      const report = await incidentClient.getReportForReviewer(reportId)
      if (!report) {
        throw new Error(`Report: '${reportId}' does not exist`)
      }
      return report
    },

    getReports: async agencyId => {
      const awaiting = await incidentClient.getIncompleteReportsForReviewer(agencyId)
      const completed = await incidentClient.getCompletedReportsForReviewer(agencyId)

      return { completed: completed.rows, awaiting: awaiting.rows }
    },

    getStatements: async (token, reportId) => {
      const statements = await statementsClient.getStatementsForReviewer(reportId)
      return statementsWithVerifiedInfo(token, statements)
    },

    getStatement: async statementId => {
      const statement = await statementsClient.getStatementForReviewer(statementId)
      if (!statement) {
        throw new Error(`Statement: '${statementId}' does not exist`)
      }
      const additionalComments = await statementsClient.getAdditionalComments(statement.id)
      return { additionalComments, ...statement }
    },
  }
}
