const prison = () => cy.get('[data-qa="prison"]')
const useOfForcePlanned = () => cy.get('[data-qa="incidentType"]')
const authorisedBy = () => cy.get('[data-qa="authorisedBy"]')
const positiveCommunicationUsed = () => cy.get('[data-qa="positiveCommunication"]')
const handcuffsApplied = () => cy.get('[data-qa=handcuffsApplied]')
const prisonerCompliant = () => cy.get('[data-qa="compliancy"]')
const photosTaken = () => cy.get('[data-qa="photographs"]')
const painInducingTechniques = () => cy.get('[data-qa=painInducingTechniques]')

module.exports = {
  useOfForcePlanned,
  authorisedBy,
  positiveCommunicationUsed,
  handcuffsApplied,
  prisonerCompliant,
  photosTaken,
  painInducingTechniques,
  prison,

  verifyInputs({
    involvedStaff = ['Mr_zagato Name (MR_ZAGATO)', 'Mrs_jones Name (MRS_JONES)', 'Test_user Name (TEST_USER)'],
  } = {}) {
    cy.get('[data-qa="incidentDate"]')
      .invoke('text')
      .invoke('trim')
      .should('match', /\d{1,2} .* \d{4}/)
    cy.get('[data-qa="incidentTime"]')
      .invoke('text')
      .invoke('trim')
      .should('match', /\d{2}:\d{2}/)

    prison().contains('Moorland')

    cy.get('[data-qa="location"]').contains('ASSO A Wing')
    useOfForcePlanned().contains('Yes')
    authorisedBy().contains('Eric Bloodaxe')

    cy.get(`[data-qa="staffInvolved"]`)
      .first()
      .find('li')
      .spread((...rest) => rest.map(element => Cypress.$(element).text().trim()))
      .then(staffPresent => {
        involvedStaff.forEach(staff => {
          expect(staffPresent).contain(staff)
        })
      })

    cy.get('[data-qa="witnesses"]').contains('Witness A').contains('Tom Jones')

    positiveCommunicationUsed().contains('Yes')
    cy.get('[data-qa="personalProtection"]').contains('Yes')
    cy.get('[data-qa="batonDrawn"]').contains('Yes and used')
    cy.get('[data-qa="pavaDrawn"]').contains('Yes and used')
    cy.get('[data-qa="guidingHold"]').contains('Yes - 2 officers involved')
    cy.get('[data-qa="restraintUsed"]').contains('Yes - standing, on back, face down, kneeling')
    handcuffsApplied().contains('Yes')
    painInducingTechniques().contains('Yes')

    cy.get('[data-qa="prisonerRelocation"]').contains('Segregation unit')
    prisonerCompliant().contains('Yes')
    cy.get('[data-qa="healthcareStaffPresent"]').contains('Dr Smith')
    cy.get('[data-qa="f213"]').contains('Dr Taylor')
    cy.get('[data-qa="prisonerHospitalisation"]').contains('Yes')
    cy.get('[data-qa="prisonerInjuries"]').contains('Yes')
    cy.get('[data-qa="staffMedicalAttention"]').contains('Jayne Eyre').contains('Eddie Thomas')
    cy.get('[data-qa="staffHospitalisation"]').contains('Jayne Eyre').contains('Eddie Thomas')

    cy.get('[data-qa="evidenceBaggedTagged"]')
      .contains('Bagged evidence 1')
      .contains('This evidence was collected from the prisoner 1')
      .contains('Bagged evidence 2')
      .contains('This evidence was collected from the prisoner 2')
      .contains('Bagged evidence 3')
      .contains('Clothes samples')
    photosTaken().contains('Yes')
    cy.get('[data-qa="cctv"]').contains('Not known')
    cy.get('[data-qa="bodyCameras"]').contains('Yes - 123, 789, 456')
  },
}
