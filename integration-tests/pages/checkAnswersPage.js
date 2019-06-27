const submittedPage = require('./submittedPage')

export default () => {
  cy.get('h1').contains('Check your answers before submitting the report')
  return {
    submit: () => {
      cy.get('[data-submit]').click()
      return submittedPage()
    },
  }
}
