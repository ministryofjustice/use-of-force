const detailsPage = require('./detailsPage')
const page = require('./page')

export default () =>
  page('New use of force incident', {
    offenderName: () => cy.get('[data-offender-name]'),
    location: () => cy.get('#location'),
    forceType: () => cy.get('#forceType'),
    staffInvolved: index => cy.get(`#involved\\[${index}\\]\\[name\\]`),
    addAnotherStaff: () => cy.get('[data-qa-add-another-staff]'),
    witnesses: index => cy.get(`#witnesses\\[${index}\\]\\[name\\]`),
    addAnotherWitness: () => cy.get('[data-qa-add-another-witness]'),
    save: () => {
      cy.get('[data-next]').click()
      return detailsPage()
    },
  })
