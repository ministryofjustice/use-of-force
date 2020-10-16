import page from '../page'

const staffMemberNotFoundPage = username =>
  page(`${username} cannot be found`, {
    clickContinue: () => cy.get('[data-qa="continue"]').click(),
  })

module.exports = { verifyOnPage: staffMemberNotFoundPage }
