const page = require('../page')

const searchForPrisonerPage = () =>
  page('Search for a prisoner', {
    prisonerNumber: () => cy.get('[name="prisonNumber"]'),
    otherDetails: () => cy.get('[data-qa="other-details"]'),
    firstName: () => cy.get('[name="firstName"]'),
    lastName: () => cy.get('[name="lastName"]'),
    prison: () => cy.get('[name="agencyId"]'),

    clickSearch: () => cy.get('[data-qa="search"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    resultCount: () => cy.get('[data-qa="result-count"]').click(),
    results: () =>
      cy
        .get(`[data-qa="results"]`)
        .find('.govuk-table__body tr')
        .spread((...rest) =>
          rest.map(element => {
            const tds = Cypress.$(element).find('td.govuk-table__cell')
            return {
              name: Cypress.$(tds[0]).text(),
              prisonNumber: Cypress.$(tds[1]).text(),
              currentPrison: Cypress.$(tds[2]).text(),
              link: Cypress.$(tds[3]).find('a')[0],
            }
          })
        ),
  })

export default { verifyOnPage: searchForPrisonerPage }
