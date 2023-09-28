export default (name, pageObject = {}, checkOnPage = () => cy.get('h1').contains(name)) => {
  const logout = () => cy.get('[data-qa=signOut]')
  checkOnPage()
  return { ...pageObject, checkStillOnPage: checkOnPage, logout }
}
