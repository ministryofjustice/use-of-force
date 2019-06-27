const detailsPage = require('./detailsPage')

export default {
  visit: bookingId => {
    cy.visit(`/form/incident/newIncident/${bookingId}`)
    cy.get('h1').contains('New use of force incident')
  },

  offenderName: () => cy.get('[data-offender-name]'),

  next: () => {
    cy.get('[data-next]').click()
    return detailsPage()
  },
}
