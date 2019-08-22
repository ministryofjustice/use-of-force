const page = require('./page')
const StatementSubmittedPage = require('./statementSubmittedPage')

const confirmStatementPage = () =>
  page('Check your statement before submitting it', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    statement: () => cy.get('[data-qa=statement]'),
    lastTraining: () => cy.get('[data-qa=last-training]'),
    jobStartYear: () => cy.get('[data-qa=job-start-year]'),
    confirm: () => cy.get('#confirm'),

    submit: () => {
      cy.get('[data-qa=submit]').click()
      return StatementSubmittedPage.verifyOnPage()
    },
  })

export default {
  verifyOnPage: confirmStatementPage,
}
