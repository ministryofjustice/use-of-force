import page from '../page'
import StaffInvolvedPage from './staffInvolvedPage'

const incidentDetailsPage = () =>
  page('Incident details', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    location: () => cy.get('#locationId'),
    prison: () => cy.get('[data-qa=prison]'),
    clickChangePrison: () => cy.get('[data-qa=change-prison-link]').click(),
    incidentDate: {
      date: () => cy.get('#incidentDate\\[date\\]'),
      hour: () => cy.get('#incidentDate\\[time\\]\\[hour\\]'),
      minute: () => cy.get('#incidentDate\\[time\\]\\[minute\\]'),
    },
    forceType: {
      check: value => cy.get('[name="plannedUseOfForce"]').check(value),
      planned: () => cy.get("[name='plannedUseOfForce'][value='true']"),
      spontaneous: () => cy.get("[name='plannedUseOfForce'][value='false']"),
      authorisedBy: () => cy.get("[name='authorisedBy']"),
    },

    fillForm() {
      this.incidentDate.date().type('12/01/2020{esc}')
      this.incidentDate.hour().type('09')
      this.incidentDate.minute().type('32')
      this.location().select('Asso A Wing')
      this.forceType.check('true')
      this.forceType.authorisedBy().type('Eric Bloodaxe')

      this.witnesses(0).name().type('Witness A')
      this.addAnotherWitness().click()
      this.witnesses(1).name().type('Witness B')
      this.addAnotherWitness().click()
      this.witnesses(2).name().type('Tom Jones')

      this.witnesses(1).remove().click()
    },

    incidentDateTime: {
      change: () => cy.get('#change-date'),
      day: () => cy.get('[data-qa=incident-date-day]'),
      month: () => cy.get('[data-qa=incident-date-month]'),
      year: () => cy.get('[data-qa=incident-date-year]'),
      time: () => cy.get('[data-qa=incident-date-time]'),
      readOnlyView: () => cy.get('#read-date'),
    },

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
      return StaffInvolvedPage.verifyOnPage()
    },
    clickSaveAndContinue: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickSave: () => cy.get('[data-qa="save"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
    saveAndReturn: () => {
      cy.get('[data-qa="save-and-return"]').click()
    },
    cancelButton: () => cy.get('[data-qa="cancel"]'),
  })

module.exports = { verifyOnPage: incidentDetailsPage }
