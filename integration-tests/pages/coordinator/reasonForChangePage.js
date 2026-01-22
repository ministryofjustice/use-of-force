import page from '../page'

const row = i => cy.get('[data-qa="table"] tbody tr').eq(i)
const tableCell = (i, colName) => row(i - 1).find(`[data-qa=${colName}]`)

const reasonForChangePage = () =>
  page('Reason for changing', {
    tableRowAndColHeading: (i, colName) => tableCell(i, colName),
    errorInReportRadio: () => cy.get('[data-qa="error-in-report"]'),
    saveButton: () => cy.get('[data-qa="save-and-continue"]'),
    cancelLink: () => cy.get('[data-qa="cancel-edit-reason-link"]'),
    backLink: () => cy.get('[data-qa="back-link"]'),
    prisonerProfile: () => cy.get('[data-qa="mini-profile"]'),
    radioErrorInReport: () => cy.get('[data-qa="error-in-report"]'),
    radioAnotherReason: () => cy.get('[data-qa="another-reason"]'),
    anotherReasonText: () => cy.get('[data-qa="another-reason-text"]'),
    additionalInfoText: () => cy.get('[data-qa="additional-info-text"]'),
  })

module.exports = {
  verifyOnPage: reasonForChangePage,
}
