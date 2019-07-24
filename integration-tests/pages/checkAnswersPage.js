const page = require('./page')

const clickSubmit = () => cy.get('[data-submit]').click()

export default () =>
  page('Check your answers before submitting the report', {
    clickSubmit,
    confirm: () => cy.get('#confirm').click(),
    errorSummary: () => cy.get('#error-summary-title'),
    errorLink: error => cy.get('[data-qa-errors]').contains(error),
    backToTasklist: () => cy.get('[data-qa="return-to-tasklist"]'),
  })
