export default (name, pageObject = {}) => {
  cy.get('h1').contains(name)
  return pageObject
}
