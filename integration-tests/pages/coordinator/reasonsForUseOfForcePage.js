import { alternativeComponentToTitle } from '../page'

const editReasonsPage = () =>
  alternativeComponentToTitle('Why was use of force applied against this prisoner?', '.govuk-fieldset__legend ', {
    reasons: () => cy.get('#uof-reasons :checked').spread((...rest) => rest.map(a => a.value)),
    checkReason: value => cy.get('#uof-reasons [type="checkbox"]').check(value),
    uncheckReason: value => cy.get('#uof-reasons [type="checkbox"]').uncheck(value),
    clickContinue: () => cy.get('[data-qa="continue-coordinator-edit"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    backLink: () => cy.get('[data-qa="back-link"]'),
  })

module.exports = {
  verifyOnPage: editReasonsPage,
}
