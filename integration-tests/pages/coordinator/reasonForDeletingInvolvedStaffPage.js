import { error } from 'console'
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
    errorSummary: () => cy.get('[data-qa="error-summary"]'),
    reasonError: () => cy.get('#reason-error'),
    anotherReasonError: () => cy.get('#reasonText-error'),
    reasonAdditionalInfoError: () => cy.get('#reasonAdditionalInfo-error'),
  })

module.exports = {
  verifyOnPage: reasonForDeletingInvolvedStaffPage,
}
