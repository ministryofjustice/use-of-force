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

module.exports = {
  visit: (statementId, signature) => {
    cy.visit(`/request-removal/${statementId}?signature=${signature}`)
    return requestRemovalPage()
  },
  goTo: (statementId, signature) => {
    cy.visit(`/request-removal/${statementId}?signature=${signature}`)
  },
  verifyOnPage: requestRemovalPage,
}
