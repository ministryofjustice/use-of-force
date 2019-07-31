const page = require('./page')
const SubmitStatementPage = require('./submitStatementPage')

const submittedPage = () =>
  page('Report sent', {
    continueToStatement: () => {
      cy.get('[data-qa=continue-to-statement]').click()
      return SubmitStatementPage.verifyOnPage()
    },
  })

export default {
  verifyOnPage: submittedPage,
}
