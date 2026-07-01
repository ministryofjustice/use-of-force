import page from '../page'

const viewIncidentPage = () =>
  page('Use of force incident', {
    editReportButton: () => cy.get('[data-qa="button-edit-report"]'),
    deleteIncidentButton: () => cy.get('[data-qa="button-delete-incident"]'),
    successBanner: () => cy.get('[data-qa="success-banner"]'),
    editHistoryLinkInSuccessBanner: () => cy.get('[data-qa="success-banner-edit-history-link"]'),
    reasonsForUseOfForce: () => cy.get('[data-qa=reasonsForUseOfForce]'),
    statementsTabLink: () => cy.get('[data-qa=statements-tab'),
    statementsTableRows: () => cy.get('[data-qa=statements] tbody tr'),
    statements: () =>
      cy
        .get('[data-qa="statements"]')
        .find('.govuk-table__body tr')
        .spread((...rest) =>
          rest.map(element => {
            const tds = Cypress.$(element).find('td.govuk-table__cell')
            return {
              username: Cypress.$(tds[0]).text(),
              email: Cypress.$(tds[1]).text().trim().replace(/\s\s+/g, ', '),
              status: Cypress.$(tds[2]).text().trim().replace(/\s\s+/g, ', '),
              action: Cypress.$(tds[3]).text().trim().replace(/\s\s+/g, ', '),
            }
          }),
        ),
    staffInvolvedTableRows: () => cy.get('[data-qa=staff-involved]'),
    returnToUseOfForceIncidentsLink: () => cy.get('[data-qa="use-of-force-incidents-link"]'),
    removalRequestLink: () => cy.get('[data-qa="view-removal-request"]'),
  })

module.exports = {
  verifyOnPage: viewIncidentPage,
}
