import page from '../page'

const reasonForChangePage = () =>
  page('Reason for changing', {
    question: () => cy.get('[data-qa="question"]'),
    oldValue: () => cy.get('[data-qa="old-value"]'),
    newValue: () => cy.get('[data-qa="new-value"]'),
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
