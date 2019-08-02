const page = require('./page')

const clickSubmit = () => cy.get('[data-submit]').click()
const incidentDateFormat = new RegExp(Cypress.moment().format('DD/MM/YYYY'))
const incidentTimeFormat = new RegExp(Cypress.moment().format('HH:mm'))

export default () =>
  page('Check your answers before sending the report', {
    verifyInputs: () => {
      cy.get('[data-qa="offenderName"]').contains('Norman Smith')
      cy.get('[data-qa="offenderNumber"]').contains('A1234AC')
      cy.get('[data-qa="incidentDate"]')
        .invoke('text')
        .should('match', incidentDateFormat)
      cy.get('[data-qa="incidentTime"]')
        .invoke('text')
        .should('match', incidentTimeFormat)
      cy.get('[data-qa="location"]').contains('Asso A Wing')
      cy.get('[data-qa="incidentType"]').contains('Planned')
      cy.get('[data-qa="staffInvolved"]').contains('Mr Zagato, Mrs Jones')
      cy.get('[data-qa="witnesses"]').contains('Witness 1, Tom Jones')

      cy.get('[data-qa="positiveCommunication"]').contains('Yes')
      cy.get('[data-qa="personalProtection"]').contains('Yes')
      cy.get('[data-qa="batonDrawn"]').contains('Yes - and used')
      cy.get('[data-qa="pavaDrawn"]').contains('Yes - and used')
      cy.get('[data-qa="guidingHold"]').contains('Yes - two officers involved')
      cy.get('[data-qa="restraintUsed"]').contains('Yes - standing, supine, prone, kneeling')
      cy.get('[data-qa="handcuffsUsed"]').contains('Ratchet')

      cy.get('[data-qa="prisonerRelocation"]').contains('Segregation unit')
      cy.get('[data-qa="compliancy"]').contains('Compliant')
      cy.get('[data-qa="healthcareStaffPresent"]').contains('Dr Smith')
      cy.get('[data-qa="f213"]').contains('Dr Taylor')
      cy.get('[data-qa="prisonerHospitalisation"]').contains('Yes')
      cy.get('[data-qa="staffMedicalAttention"]').contains('Eddie Thomas, Jayne Eyre')
      cy.get('[data-qa="staffHospitalisation"]').contains('Eddie Thomas, Jayne Eyre')

      cy.get('[data-qa="evidenceBaggedTagged"]')
        .contains('Bagged evidence 1')
        .contains('This evidence was collected from the prisoner 1')
        .contains('Bagged evidence 2')
        .contains('This evidence was collected from the prisoner 2')
        .contains('Bagged evidence 3')
        .contains('Clothes samples')
      cy.get('[data-qa="photographs"]').contains('Yes')
      cy.get('[data-qa="cctv"]').contains('Not known')
      cy.get('[data-qa="bodyCameras"]').contains('123, 789, 456')
    },

    clickSubmit,
    confirm: () => cy.get('#confirm').click(),
    errorSummary: () => cy.get('#error-summary-title'),
    errorLink: error => cy.get('[data-qa-errors]').contains(error),
    backToTasklist: () => cy.get('[data-qa="return-to-tasklist"]'),
  })
