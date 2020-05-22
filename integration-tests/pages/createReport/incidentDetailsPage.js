const page = require('../page')
const UseOfForceDetailsPage = require('./useOfForceDetailsPage')

const incidentDetailsPage = () =>
  page('Incident details', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    location: () => cy.get('#locationId'),
    prison: () => cy.get('[data-qa=prison]'),
    clickChangePrison: () => cy.get('[data-qa=change-prison-link]').click(),

    forceType: {
      check: value => cy.get('[name="plannedUseOfForce"]').check(value),
      planned: () => cy.get("[name='plannedUseOfForce'][value='true']"),
      spontaneous: () => cy.get("[name='plannedUseOfForce'][value='false']"),
    },

    fillForm() {
      this.location().select('Asso A Wing')
      this.forceType.check('true')
      this.staffInvolved(0)
        .name()
        .type('Dr Smith')
      this.addAnotherStaff().click()
      this.staffInvolved(1)
        .name()
        .type('MR_ZAGATO')
      this.addAnotherStaff().click()
      this.staffInvolved(2)
        .name()
        .type('MRS_JONES')

      this.witnesses(0)
        .name()
        .type('Witness A')
      this.addAnotherWitness().click()
      this.witnesses(1)
        .name()
        .type('Witness B')
      this.addAnotherWitness().click()
      this.witnesses(2)
        .name()
        .type('Tom Jones')

      this.staffInvolved(0)
        .remove()
        .click()

      this.witnesses(1)
        .remove()
        .click()
    },

    incidentDateTime: {
      change: () => cy.get('#change-date'),
      day: () => cy.get('[data-qa=incident-date-day]'),
      month: () => cy.get('[data-qa=incident-date-month]'),
      year: () => cy.get('[data-qa=incident-date-year]'),
      time: () => cy.get('[data-qa=incident-date-time]'),
      readOnlyView: () => cy.get('#read-date'),
    },

    staffInvolved: index => ({
      name: () => cy.get(`#involvedStaff\\[${index}\\]\\[username\\]`),
      remove: () =>
        cy
          .get(`#involvedStaff\\[${index}\\]\\[username\\]`)
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
      return UseOfForceDetailsPage.verifyOnPage()
    },
    clickSave: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    saveAndReturn: () => {
      cy.get('[data-qa="save-and-return"]').click()
    },
    cancelButton: () => cy.get('[data-qa="cancel"]'),
  })

export default { verifyOnPage: incidentDetailsPage }
