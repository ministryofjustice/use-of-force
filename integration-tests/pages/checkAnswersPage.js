const page = require('./page')

const clickSubmit = () => cy.get('[data-submit]').click()

const checkAnswersPage = () =>
  page('Check your answers before sending the report', {
    editIncidentDetailsLink: () => cy.get('[data-qa="incidentDetails-link"'),
    editUseOfForceDetailsLink: () => cy.get('[data-qa="useOfForceDetails-link"'),
    editRelocationAndInjuriesLink: () => cy.get('[data-qa="relocationAndInjuries-link"'),
    editEvidenceLink: () => cy.get('[data-qa="evidence-link"'),

    useOfForcePlanned: () => cy.get('[data-qa="incidentType"]'),
    positiveCommunicationUsed: () => cy.get('[data-qa="positiveCommunication"]'),
    prisonerCompliant: () => cy.get('[data-qa="compliancy"]'),
    photosTaken: () => cy.get('[data-qa="photographs"]'),

    verifyInputs() {
      cy.get('[data-qa="incidentDate"]')
        .invoke('text')
        .invoke('trim')
        .should('match', /\d{1,2} .* \d{4}/)
      cy.get('[data-qa="incidentTime"]')
        .invoke('text')
        .invoke('trim')
        .should('match', /\d{2}:\d{2}/)
      cy.get('[data-qa="location"]').contains('ASSO A Wing')
      this.useOfForcePlanned().contains('Yes')
      cy.get('[data-qa="staffInvolved"]')
        .contains('MR_ZAGATO')
        .contains('MRS_JONES')
      cy.get('[data-qa="witnesses"]')
        .contains('Witness A')
        .contains('Tom Jones')

      this.positiveCommunicationUsed().contains('Yes')
      cy.get('[data-qa="personalProtection"]').contains('Yes')
      cy.get('[data-qa="batonDrawn"]').contains('Yes and used')
      cy.get('[data-qa="pavaDrawn"]').contains('Yes and used')
      cy.get('[data-qa="guidingHold"]').contains('Yes - 2 officers involved')
      cy.get('[data-qa="restraintUsed"]').contains('Yes - standing, on back, face down, kneeling')

      cy.get('[data-qa="prisonerRelocation"]').contains('Segregation unit')
      this.prisonerCompliant().contains('Yes')
      cy.get('[data-qa="healthcareStaffPresent"]').contains('Dr Smith')
      cy.get('[data-qa="f213"]').contains('Dr Taylor')
      cy.get('[data-qa="prisonerHospitalisation"]').contains('Yes')
      cy.get('[data-qa="prisonerInjuries"]').contains('Yes')
      cy.get('[data-qa="staffMedicalAttention"]')
        .contains('Jayne Eyre')
        .contains('Eddie Thomas')
      cy.get('[data-qa="staffHospitalisation"]')
        .contains('Jayne Eyre')
        .contains('Eddie Thomas')

      cy.get('[data-qa="evidenceBaggedTagged"]')
        .contains('Bagged evidence 1')
        .contains('This evidence was collected from the prisoner 1')
        .contains('Bagged evidence 2')
        .contains('This evidence was collected from the prisoner 2')
        .contains('Bagged evidence 3')
        .contains('Clothes samples')
      this.photosTaken().contains('Yes')
      cy.get('[data-qa="cctv"]').contains('Not known')
      cy.get('[data-qa="bodyCameras"]').contains('Yes - 123, 789, 456')
    },

    clickSubmit,
    backToTasklist: () => cy.get('[data-qa="return-to-tasklist"]'),
  })

export default { verifyOnPage: checkAnswersPage }
