import page from '../page'

const deleteIncidentReasonPage = () =>
  page('Reason for deleting this report', {
    reasonRadio: reason => cy.get(`[data-qa="${reason}"]`),
    continueButton: () => cy.get('button[type="submit"]'),
    errorSummary: () => cy.get('.govuk-error-summary'),
    anotherReasonText: () => cy.get('[data-qa="another-reason-text"]'),
    backLink: () => cy.get('[data-qa="back-link"], a.govuk-back-link'),
  })

module.exports = {
  verifyOnPage: deleteIncidentReasonPage,
}
