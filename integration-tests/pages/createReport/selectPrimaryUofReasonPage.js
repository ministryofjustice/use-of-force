import page from '../page'

const selectPrimaryUofReasonPage = () =>
  page(
    'n/a',
    {
      primaryReason: () => cy.get('#uof-primary-reasons :checked'),
      checkReason: value => cy.get('#uof-primary-reasons [type="radio"]').check(value),
      clickSaveAndContinue: () => cy.get('[data-qa="save-and-continue"]').click(),
      clickSave: () => cy.get('[data-qa="save"]').click(),
      clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    },
    () => {
      cy.get('h1').contains('Use of force details')
      cy.get('legend.govuk-fieldset__legend--l').contains(
        'What was the primary reason use of force was applied against this prisoner?',
      )
    },
  )

module.exports = { verifyOnPage: selectPrimaryUofReasonPage }
