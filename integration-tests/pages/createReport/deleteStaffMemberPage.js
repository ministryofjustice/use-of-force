import page from '../page'

const deleteStaffMemberPage = username =>
  page(`Are you sure you want to delete ${username}?`, {
    yes: () => cy.get('#yes'),
    no: () => cy.get('#no'),
    clickContinue: () => cy.get('[data-qa="continue"]').click(),
  })

module.exports = { verifyOnPage: deleteStaffMemberPage }
