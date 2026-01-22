import { alternativeComponentToTitle } from '../page'

const editPrimaryReasonPage = () =>
  alternativeComponentToTitle(
    'What was the primary reason use of force was applied against this prisoner?',
    '.govuk-fieldset__legend ',
    {
      primaryReason: () => cy.get('#uof-primary-reasons :checked'),
      checkReason: value => cy.get('#uof-primary-reasons [type="radio"]').check(value),
      clickContinue: () => cy.get('[data-qa="continue-coordinator-edit"]').click(),
      clickCancel: () => cy.get('[data-qa="cancel"]').click(),
      clickBack: () => cy.get('[data-qa="back-link"]').click(),
      errorSummaryTitle: () => cy.get('.govuk-error-summary__title'),
      errorSummaryText: () => cy.get('.govuk-error-summary__list'),
    }
  )

module.exports = {
  verifyOnPage: editPrimaryReasonPage,
}
