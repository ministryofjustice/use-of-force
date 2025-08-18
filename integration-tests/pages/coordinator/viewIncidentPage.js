import page from '../page'

const viewIncidentPage = () =>
  page('Use of force incident', {
    editReportButton: () => cy.get('[data-qa="button-edit-report"]'),
  })

module.exports = {
  verifyOnPage: viewIncidentPage,
}
