const page = require('./page')
const StatementSubmittedPage = require('./statementSubmittedPage')

const submitStatementPage = () =>
  page('Use of force statement', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    lastTrainingMonth: () => cy.get('[name=lastTrainingMonth]'),
    lastTrainingYear: () => cy.get('[name=lastTrainingYear]'),
    jobStartYear: () => cy.get('[name=jobStartYear]'),
    statement: () => cy.get('[name=statement]'),
    confirm: () => cy.get('confirm'),

    submit: () => {
      cy.get('[data-qa=submit]').click()
      return StatementSubmittedPage.verifyOnPage()
    },
  })

export default {
  verifyOnPage: submitStatementPage,
}
