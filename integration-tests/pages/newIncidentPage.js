const detailsPage = require('./detailsPage')
const page = require('./page')

export default {
  visit: bookingId => {
    cy.visit(`/form/incident/newIncident/${bookingId}`)
    return page('New use of force incident', {
      offenderName: () => cy.get('[data-offender-name]'),

      next: () => {
        cy.get('[data-next]').click()
        return detailsPage()
      },
    })
  },
}
