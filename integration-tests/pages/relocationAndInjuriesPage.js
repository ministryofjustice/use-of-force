const evidencePage = require('./evidencePage')

export default () => {
  cy.get('h1').contains('Relocation and injuries')
  return {
    next: () => {
      cy.get('[data-next]').click()
      return evidencePage()
    },
  }
}
