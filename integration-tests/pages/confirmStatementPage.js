const page = require('./page')
const StatementSubmittedPage = require('./statementSubmittedPage')

const confirmStatementPage = () =>
  page('Use of force statement - review', {
    statement: () => cy.get('[name=statement]'),
    confirm: () => cy.get('#confirm'),

    submit: () => {
      cy.get('[data-qa=submit]').click()
      return StatementSubmittedPage.verifyOnPage()
    },
  })

export default {
  verifyOnPage: confirmStatementPage,
}
