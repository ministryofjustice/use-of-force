const page = require('./page')
const detailsPage = require('./detailsPage')

export default () =>
  page('New use of force incident', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    location: () => cy.get('#location'),

    forceType: {
      check: value => cy.get('[name="plannedUseOfForce"]').check(value),
      planned: () => cy.get("[name='plannedUseOfForce'][value='true']"),
      spontaneous: () => cy.get("[name='plannedUseOfForce'][value='false']"),
    },

    fillForm: () => {
      cy.get('[data-qa=offender-name]')
      cy.get('#location').select('Asso A Wing')
      cy.get('[name="plannedUseOfForce"]').check('true')
      cy.get('[name="involved[0][username]"]').type('Dr Smith')
      cy.get('.add-another-staff-member > .button-action > .govuk-button').click()
      cy.get('[name="involved[1][username]"]').type('Mr Zagato')
      cy.get('.add-another-staff-member > .button-action > .govuk-button').click()
      cy.get('[name="involved[2][username]"]').type('Mrs Jones')
      cy.get('[name="witnesses[0][name]').type('Witness 1')
      cy.get('.add-another-witness > .button-action > .govuk-button').click()
      cy.get('[name="witnesses[1][name]').type('Witness two')
      cy.get('.add-another-witness > .button-action > .govuk-button').click()
      cy.get('[name="witnesses[2][name]').type('Tom Jones')
      cy.get('.add-another-staff-member > :nth-child(1) > .govuk-button').click()
      cy.get('.add-another-witness > :nth-child(2) > .govuk-button').click()
    },

    staffInvolved: index => ({
      name: () => cy.get(`#involved\\[${index}\\]\\[username\\]`),
      remove: () =>
        cy
          .get(`#involved\\[${index}\\]\\[username\\]`)
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
