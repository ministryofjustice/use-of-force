import page from '../page'

const selectUofReasonsPage = () =>
  page(
    'n/a',
    {
      checkReasons: value => cy.get('#uof-reasons [type="checkbox"]').check(value),
      clickSaveAndContinue: () => cy.get('[data-qa="save-and-continue"]').click(),
      clickSave: () => cy.get('[data-qa="save"]').click(),
      clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    },
    () => {
      cy.get('h1').contains('Use of force details')
      cy.get('legend.govuk-fieldset__legend--l').contains('Why was use of force applied?')
    }
  )

module.exports = { verifyOnPage: selectUofReasonsPage }
