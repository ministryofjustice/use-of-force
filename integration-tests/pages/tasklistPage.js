const newIncidentPage = require('./newIncidentPage')
const page = require('./page')

export default {
  visit: bookingId => {
    cy.visit(`/${bookingId}`)
    return page('Report use of force', {
      startNewForm: () => {
        cy.get('[data-qa-new-incident-link]').click()
        return newIncidentPage()
      },
      checkNoPartsComplete: () => {
        cy.get('[data-qa-new-incident-completed]').should('not.exist')
        cy.get('[data-qa-details-completed]').should('not.exist')
        cy.get('[data-qa-relocation-and-injuries-completed]').should('not.exist')
        cy.get('[data-qa-evidence-completed]').should('not.exist')
      },
      checkAllPartsComplete: () => {
        cy.get('[data-qa-new-incident-completed]').should('exist')
        cy.get('[data-qa-details-completed]').should('exist')
        cy.get('[data-qa-relocation-and-injuries-completed]').should('exist')
        cy.get('[data-qa-evidence-completed]').should('exist')
      },
    })
  },
}
