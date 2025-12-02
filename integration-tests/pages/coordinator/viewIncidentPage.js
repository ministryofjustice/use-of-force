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
    editHistoryTable: () => cy.get('[data-qa=edit-history-table]'),
    editHistoryTableRows: () => cy.get('[data-qa=edit-history-table] tbody tr'),
    editHistoryTableWhatChanged: () => cy.get('[data-qa=what-changed]'),
    editHistoryTableOldValue: () => cy.get('[data-qa=old-value]'),
    editHistoryTableNewValue: () => cy.get('[data-qa=new-value]'),
    editHistoryTablReason: () => cy.get('[data-qa=reason]'),
    editHistoryTableAdditionalComments: () => cy.get('[data-qa=edit-history-table] tbody .govuk-details__text'),
    statementsTableRows: () => cy.get('[data-qa=statements] tbody tr'),
    staffInvolvedTableRows: () => cy.get('[data-qa=staff-involved]'),
    returnToUseOfForceIncidentsLink: () => cy.get('[data-qa="use-of-force-incidents-link"]'),
  })

module.exports = {
  verifyOnPage: viewIncidentPage,
}
