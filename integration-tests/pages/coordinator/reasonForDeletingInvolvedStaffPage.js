import page from '../page'

const reasonForDeletingInvolvedStaffPage = () =>
  page('Reason for deleting this person', {
    reasonPersonNotInvolvedRadionButton: () => cy.get('[data-qa="person-not-involved"]'),
    reasonPersonAddedInErrorRadionButton: () => cy.get('[data-qa="person-added-in-error"]'),
    reasonAnotherReasonRadionButton: () => cy.get('[data-qa="another-reason"]'),
    reasonAnotherReasonInput: () => cy.get('[data-qa="another-reason-text"]'),
    additionalInfoTextInput: () => cy.get('[data-qa="additional-info-text"]'),
    backLink: () => cy.get('[data-qa="back-link"]'),
    saveChanges: () => cy.get('[data-qa="save-and-continue"]'),
    cancelLink: () => cy.get('[data-qa="cancel-edit-reason-link"]'),
  })

module.exports = {
  verifyOnPage: reasonForDeletingInvolvedStaffPage,
}
