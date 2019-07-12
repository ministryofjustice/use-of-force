const page = require('./page')
const submittedPage = require('./submittedPage')

const clickSubmit = () => cy.get('[data-submit]').click()

export default () =>
  page('Check your answers before submitting the report', {
    clickSubmit,
    submit: () => {
      clickSubmit()
      return submittedPage()
    },
    confirm: () => cy.get('#confirm').click(),
    errorSummary: () => cy.get('#error-summary-title'),
    errorLink: error => cy.get('[data-qa-errors]').contains(error),
  })
