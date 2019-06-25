export default {
  visit: bookingId => {
    cy.visit(`/form/incident/newIncident/${bookingId}`)
  },

  header: () => {
    return cy.get('h1')
  },

  offenderName: () => {
    return cy.get('[data-offender-name]')
  },
}
