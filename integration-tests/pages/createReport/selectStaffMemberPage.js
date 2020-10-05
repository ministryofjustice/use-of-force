import page from '../page'

const whatIsStaffMembersNamePage = () =>
  page('There is more than 1 person with that name', {
    select: username => cy.get(`[data-qa="${username}"]`),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    clickContinue: () => cy.get('[data-qa="continue"]').click(),
  })

module.exports = { verifyOnPage: whatIsStaffMembersNamePage }
