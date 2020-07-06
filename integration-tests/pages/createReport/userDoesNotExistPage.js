import page from '../page'

const userDoesNotExistPage = () =>
  page('A username you have entered does not exist', {
    missingUsers: () =>
      cy.get(`[data-qa="missing-user"]`).spread((...rest) => rest.map(element => Cypress.$(element).text())),
    continue: () => cy.get('[data-qa=continue]'),
    return: () => cy.get('[data-qa=return-to-incident-details]'),
  })

module.exports = {
  verifyOnPage: userDoesNotExistPage,
}
