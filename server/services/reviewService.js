module.exports = function createReviewService({ statementsClient }) {
  return {
    getStatements: statementsClient.getStatementsForReviewer,
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
