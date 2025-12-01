import page from '../page'

const viewInvolvedStaffPage = () =>
  page('Staff involved', {
    staffInvolvedTableRows: () => cy.get('[data-qa="involved-staff-table"] tbody tr'),
    staffInvolvedTableRowDeleteLink: staffId => cy.get(`[data-qa=delete-staff-${staffId}]`),
    successBanner: () => cy.get('.moj-alert--success'),
  })

module.exports = {
  verifyOnPage: viewInvolvedStaffPage,
}
