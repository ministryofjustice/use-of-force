import page from '../page'

const viewIncidentPage = () =>
  page('Use of force incident', {
    editReportButton: () => cy.get('[data-qa="button-edit-report"]'),
    deleteIncidentButton: () => cy.get('[data-qa="button-delete-incident"]'),
    successBanner: () => cy.get('[data-qa="success-banner"]'),
    editHistoryLinkInSuccessBanner: () => cy.get('[data-qa="success-banner-edit-history-link"]'),
    reasonsForUseOfForce: () => cy.get('[data-qa=reasonsForUseOfForce]'),
  })

module.exports = {
  verifyOnPage: viewIncidentPage,
}
