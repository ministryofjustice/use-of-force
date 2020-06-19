const page = require('../page')
const StatementSubmittedPage = require('./statementSubmittedPage')
const YourStatementsPage = require('./yourStatementsPage')

const confirmStatementPage = () =>
  page('Check your statement before submitting it', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    statement: () => cy.get('[data-qa=statement]'),
    lastTraining: () => cy.get('[data-qa=last-training]'),
    jobStartYear: () => cy.get('[data-qa=job-start-year]'),

    submit: () => {
      cy.get('[data-qa=submit]').click()
      return StatementSubmittedPage.verifyOnPage()
    },
    completeLater: () => {
      cy.get('[data-qa=save-and-complete-later]').click()
    },
  })

export default {
  verifyOnPage: confirmStatementPage,
}
