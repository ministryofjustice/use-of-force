const page = require('./page')

const viewStatementsPage = () =>
  page('Use of force incident', {
    reporterName: () => cy.get('[data-qa="reporter-name"]'),

    submittedDate: () => cy.get('[data-qa="submitted-date"]'),

    prisonerName: () => cy.get('[data-qa="prisoner-name"]'),

    prisonNumber: () => cy.get('[data-qa="prison-number"]'),

    statements: () =>
      cy
        .get(`[data-qa="statements"]`)
        .find('.govuk-table__body tr')
        .spread((...rest) =>
          rest.map(element => {
            const tds = Cypress.$(element).find('td.govuk-table__cell')
            return {
              username: Cypress.$(tds[0]).text(),
              link: Cypress.$(tds[1])
                .text()
                .trim(),
              isOverdue: Cypress.$(tds[1]).find('[data-qa="overdue"]').length === 1,
            }
          })
        ),
    return: () => cy.get('[data-qa=return-link]'),
  })

export default {
  verifyOnPage: viewStatementsPage,
}
