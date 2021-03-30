import page from '../page'
// import ConfirmStatementPage from './checkYourStatementPage'

const requestRemovalPage = () =>
  page('Request to be removed from a use of force incident', {
    incidentDate: () => cy.get('.incidentDate'),
    incidentTime: () => cy.get('.incidentTime'),
    prisonName: () => cy.get('.prisonName'),
    reason: () => cy.get('[name=removal-reason]'),

    requestToBeRemoved: () => cy.get('[data-qa=submit]'),
    submit: () => {
      cy.get('[data-qa=submit]').click()
      //   return ConfirmStatementPage.verifyOnPage()
    },
  })

module.exports = {
  visit: statementId => {
    cy.visit(`/request-removal/${statementId}`)
    return requestRemovalPage()
  },
  verifyOnPage: requestRemovalPage,
}
