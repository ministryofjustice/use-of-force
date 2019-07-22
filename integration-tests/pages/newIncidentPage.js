const page = require('./page')
const detailsPage = require('./detailsPage')

export default () =>
  page('New use of force incident', {
    offenderName: () => cy.get('[data-offender-name]'),
    location: () => cy.get('#location'),

    forceType: {
      check: value => cy.get('[name="forceType"]').check(value),
      planned: () => cy.get("[name='forceType'][value='planned']"),
      spontaneous: () => cy.get("[name='forceType'][value='spontaneous']"),
    },

    staffInvolved: index => ({
      name: () => cy.get(`#involved\\[${index}\\]\\[name\\]`),
      remove: () =>
        cy
          .get(`#involved\\[${index}\\]\\[name\\]`)
          .parents('.add-another__item')
          .find('button.add-another__remove-button'),
    }),
    addAnotherStaff: () => cy.get('[data-qa-add-another-staff]'),

    witnesses: index => ({
      name: () => cy.get(`#witnesses\\[${index}\\]\\[name\\]`),
      remove: () =>
        cy
          .get(`#witnesses\\[${index}\\]\\[name\\]`)
          .parents('.add-another__item')
          .find('button.add-another__remove-button'),
    }),
    addAnotherWitness: () => cy.get('[data-qa-add-another-witness]'),

    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return detailsPage()
    },
  })
