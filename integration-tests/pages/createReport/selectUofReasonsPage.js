import page from '../page'

const selectUofReasonsPage = () =>
  page(
    'n/a',
    {
      reasons: () => cy.get('#uof-reasons :checked').spread((...rest) => rest.map(a => a.value)),
      checkReason: value => cy.get('#uof-reasons [type="checkbox"]').check(value),
      uncheckReason: value => cy.get('#uof-reasons [type="checkbox"]').uncheck(value),
      clickSaveAndContinue: () => cy.get('[data-qa="save-and-continue"]').click(),
      clickSaveAndReturn: () => cy.get('[data-qa="save-and-return"]').click(),
      clickSave: () => cy.get('[data-qa="save"]').click(),
      clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    },
    () => {
      cy.get('h1').contains('Use of force details')
      cy.get('legend.govuk-fieldset__legend--l').contains('Why was use of force applied against this prisoner?')
    },
  )

module.exports = { verifyOnPage: selectUofReasonsPage }
