export default (name, pageObject = {}, checkOnPage = () => cy.get('h1').contains(name)) => {
  const logout = () => cy.get('[data-qa=signOut]')
  checkOnPage()
  return { ...pageObject, checkStillOnPage: checkOnPage, logout }
}

// to use when we want to check something other than the h1 to verify we have reached that page
export const alternativeComponentToTitle = (
  name,
  tag,
  pageObject = {},
  checkOnPage = () => cy.get(tag).contains(name)
) => {
  const logout = () => cy.get('[data-qa=signOut]')
  checkOnPage()
  return { ...pageObject, checkStillOnPage: checkOnPage, logout }
}
