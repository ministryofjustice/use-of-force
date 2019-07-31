const page = require('./page')
const StatementSubmittedPage = require('./statementSubmittedPage')

const submitStatementPage = () =>
  page('Use of force statement', {
    submit: () => {
      cy.get('[data-qa=submit]').click()
      return StatementSubmittedPage.verifyOnPage()
    },
  })

export default {
  verifyOnPage: submitStatementPage,
}
