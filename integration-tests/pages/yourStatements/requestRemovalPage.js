import page from '../page'

const requestRemovalPage = () =>
  page('Request to be removed from a use of force incident', {
    incidentDate: () => cy.get('.incidentDate'),
    incidentTime: () => cy.get('.incidentTime'),
    prisonName: () => cy.get('.prisonName'),
    reason: () => cy.get('[name=reason]'),
    inlineError: () => cy.get('.govuk-error-message'),

    errorSummaryTitle: () => cy.get('#error-summary-title'),
    errorSummaryBody: () => cy.get('.govuk-error-summary__body'),

    requestToBeRemoved: () => cy.get('[data-qa=submit]'),
    submit: () => {
      cy.get('[data-qa=submit]').click()
    },
  })

const visit = statementId =>
  cy.task('stringToHash', statementId.toString()).then(signature => {
    cy.visit(`/request-removal/${statementId}?signature=${encodeURIComponent(signature)}`)
  })

module.exports = {
  visit: statementId => {
    visit(statementId)
    return requestRemovalPage()
  },
  goTo: statementId => visit(statementId),
  verifyOnPage: requestRemovalPage,
}
