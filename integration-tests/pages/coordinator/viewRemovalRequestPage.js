import page from '../page'

const viewRemovalRequestPage = () =>
  page('Request to be removed from use of force incident', {
    name: () => cy.get('[data-qa=name]'),
    userId: () => cy.get('[data-qa=userId]'),
    location: () => cy.get('[data-qa=location]'),
    emailAddress: () => cy.get('[data-qa=email]'),
    removalReason: () => cy.get('[data-qa=removalReason]'),
    inlineError: () => cy.get('.govuk-error-message'),

    errorSummaryTitle: () => cy.get('#error-summary-title'),
    errorSummaryBody: () => cy.get('.govuk-error-summary__body'),

    continue: () => cy.get('[data-qa=continue]'),
    confirm: () => cy.get('[name="confirm"]').check('yes'),
    refuse: () => cy.get('[name="confirm"]').check('no'),
  })

module.exports = {
  verifyOnPage: viewRemovalRequestPage,
}
