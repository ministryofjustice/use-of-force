export default () => {
  cy.get('h1').contains('Use of force details')
  return {
    next: () => {
      cy.get('[data-next]').click()
    },
  }
}
