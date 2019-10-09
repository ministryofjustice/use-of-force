const page = require('../page')
const SubmitStatementPage = require('../yourStatements/writeYourStatementPage')

const reportSent = () =>
  page('This report has been sent to the use of force coordinator', {
    continueToStatement: () => {
      cy.get('[data-qa=continue-to-statement]').click()
      return SubmitStatementPage.verifyOnPage()
    },
    exit: () => cy.get('[data-qa=exit]'),
    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*\/(.*)\/report-sent/)
        return match[1]
      })
    },
  })

export default {
  verifyOnPage: reportSent,
}
