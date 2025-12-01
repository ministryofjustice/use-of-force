import page from '../page'

const viewIncidentPage = () =>
  page('Use of force incident', {
    editReportButton: () => cy.get('[data-qa="button-edit-report"]'),
    deleteIncidentButton: () => cy.get('[data-qa="button-delete-incident"]'),
    successBanner: () => cy.get('[data-qa="success-banner"]'),
    editHistoryLinkInSuccessBanner: () => cy.get('[data-qa="success-banner-edit-history-link"]'),
    reasonsForUseOfForce: () => cy.get('[data-qa=reasonsForUseOfForce]'),
    statementsTabLink: () => cy.get('[data-qa=statements-tab'),
    editHistoryTabLink: () => cy.get('[data-qa=edit-history-tab]'),
    statementsTableRows: () => cy.get('[data-qa=statements] tbody tr'),
    staffInvolvedTableRows: () => cy.get('[data-qa=staff-involved]'),
    returnToUseOfForceIncidentsLink: () => cy.get('[data-qa="use-of-force-incidents-link"]'),
  })

module.exports = {
  verifyOnPage: viewIncidentPage,
}
