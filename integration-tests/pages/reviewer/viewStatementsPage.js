import page from '../page'

const viewStatementsPage = () =>
  page('Use of force incident', {
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
              badge: Cypress.$(tds[1]).text().trim().replace(/\s\s+/g, ', '),
              link: Cypress.$(tds[2]).text().trim().replace(/\s\s+/g, ', '),
              isOverdue: Cypress.$(tds[1]).find('[data-qa="overdue"]').length === 1,
              isUnverified: Cypress.$(tds[1]).find('[data-qa="unverified"]').length === 1,
            }
          })
        ),

    reportLink: () => cy.get('[data-qa="report-link"]'),

    statementLink: index => cy.get(`[data-qa="statements"]`).find('.govuk-table__body tr').eq(index).find('a'),

    return: () => cy.get('[data-qa=return-link]'),
  })

module.exports = {
  verifyOnPage: viewStatementsPage,
}
