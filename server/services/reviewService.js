module.exports = function createReviewService({ statementsClient, incidentClient }) {
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
