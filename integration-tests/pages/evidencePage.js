const checkAnswersPage = require('./checkAnswersPage')

export default () => {
  cy.get('h1').contains('Evidence')
  return {
    next: () => {
      cy.get('[data-next]').click()
      return checkAnswersPage()
    },
  }
}
