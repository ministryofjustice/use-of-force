const page = require('./page')

const clickSubmit = () => cy.get('[data-submit]').click()

export default () =>
  page('Check your answers before sending the report', {
    verifyInputs: () => {
      cy.get('[data-qa="incidentDate"]')
        .invoke('text')
        .invoke('trim')
        .should('match', /^([0-2][0-9]|3[0-1]) .*? (2019|20[2-9][0-9])$/)
      cy.get('[data-qa="incidentTime"]')
        .invoke('text')
        .invoke('trim')
        .should('match', /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      cy.get('[data-qa="location"]').contains('ASSO A Wing')
      cy.get('[data-qa="incidentType"]').contains('Planned')
      cy.get('[data-qa="staffInvolved"]').contains('Mr Zagato Name, Mrs Jones Name')
      cy.get('[data-qa="witnesses"]').contains('Witness 1, Tom Jones')

      cy.get('[data-qa="positiveCommunication"]').contains('Yes')
      cy.get('[data-qa="personalProtection"]').contains('Yes')
      cy.get('[data-qa="batonDrawn"]').contains('Yes - and used')
      cy.get('[data-qa="pavaDrawn"]').contains('Yes - and used')
      cy.get('[data-qa="guidingHold"]').contains('Yes - two officers involved')
      cy.get('[data-qa="restraintUsed"]').contains('Yes - standing, on back, face down, kneeling')

      cy.get('[data-qa="prisonerRelocation"]').contains('Segregation unit')
      cy.get('[data-qa="compliancy"]').contains('Yes')
      cy.get('[data-qa="healthcareStaffPresent"]').contains('Dr Smith')
      cy.get('[data-qa="f213"]').contains('Dr Taylor')
      cy.get('[data-qa="prisonerHospitalisation"]').contains('Yes')
      cy.get('[data-qa="prisonerInjuries"]').contains('Yes')
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
