export default (name, pageObject = {}, checkOnPage = () => cy.get('h1').contains(name)) => {
  const logout = () => cy.get('[data-qa=logout]')
  const feedbackBannerLink = () => cy.get('[data-qa="feedback-banner"]').find('a')
  checkOnPage()
  return { ...pageObject, checkStillOnPage: checkOnPage, logout, feedbackBannerLink }
}
