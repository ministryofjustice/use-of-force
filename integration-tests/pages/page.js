export default (name, pageObject = {}, checkOnPage = () => cy.get('h1').contains(name)) => {
  const logout = () => cy.get('[data-qa=logout]')
  checkOnPage()
  return { ...pageObject, checkStillOnPage: checkOnPage, logout }
}
