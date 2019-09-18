module.exports = function createReviewService({ statementsClient }) {
  return {
    getStatements: reportId => statementsClient.getStatementsForReviewer(reportId),
  }
}
