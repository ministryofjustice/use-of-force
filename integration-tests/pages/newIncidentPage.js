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

    fillForm() {
      this.offenderName().contains('Norman Smith (A1234AC)')
      this.location().select('Asso A Wing')
      this.forceType.check('true')

      this.staffInvolved(0)
        .name()
        .type('Mr Zagato')
      this.addAnotherStaff().click()

      this.staffInvolved(1)
        .name()
        .type('Mrs Jones')

      this.witnesses(0)
        .name()
        .type('Witness 1')
      this.addAnotherWitness().click()

      this.witnesses(1)
        .name()
        .type('Tom Jones')
      this.addAnotherWitness().click()
      this.addAnotherWitness().click()
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
