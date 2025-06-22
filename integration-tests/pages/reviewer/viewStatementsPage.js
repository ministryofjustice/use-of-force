import page from '../page'

const viewStatementsPage = () =>
  page('Use of force incident', {
    reportTab: () => cy.get('[data-qa="report-tab"]'),

    reporterName: () => cy.get('[data-qa="reporter-name"]'),

    submittedDate: () => cy.get('[data-qa="submitted-date"]'),

    prisonerName: () => cy.get('[data-qa="prisoner-name"]'),

    prisonNumber: () => cy.get('[data-qa="prisoner-number"]'),

    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*\/(.*)\/view-statements/)
        return match[1]
      })
    },

    statements: () =>
      cy
        .get(`[data-qa="statements"]`)
        .find('.govuk-table__body tr')
        .spread((...rest) =>
          rest.map(element => {
            const tds = Cypress.$(element).find('td.govuk-table__cell')
            return {
              username: Cypress.$(tds[0]).text(),
              email: Cypress.$(tds[2]).text(),
              badge: Cypress.$(tds[3]).text().trim().replace(/\s\s+/g, ', '),
              link: Cypress.$(tds[5]).text().trim().replace(/\s\s+/g, ', '),
              isOverdue: Cypress.$(tds[3]).find('[data-qa="overdue"]').length === 1,
              isUnverified: Cypress.$(tds[2]).find('[data-qa="unverified"]').length === 1,
            }
          })
        ),

    statementLink: index => cy.get(`[data-qa="statements"]`).find('.govuk-table__body tr').eq(index).find('a'),

    return: () => cy.get('[data-qa=return-link]'),
  })

module.exports = {
  verifyOnPage: viewStatementsPage,
}
