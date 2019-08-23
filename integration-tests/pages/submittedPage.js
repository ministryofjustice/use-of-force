const page = require('./page')
const SubmitStatementPage = require('./submitStatementPage')

const submittedPage = () =>
  page('This report has been sent to the use of force coordinator', {
    continueToStatement: () => {
      cy.get('[data-qa=continue-to-statement]').click()
      return SubmitStatementPage.verifyOnPage()
    },
    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*submitted\/(.*)/)
        return match[1]
      })
    },
  })

export default {
  verifyOnPage: submittedPage,
}
