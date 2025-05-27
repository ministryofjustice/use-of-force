const prison = () => cy.get('[data-qa="prison"]')
const useOfForcePlanned = () => cy.get('[data-qa="incidentType"]')
const authorisedBy = () => cy.get('[data-qa="authorisedBy"]')
const positiveCommunicationUsed = () => cy.get('[data-qa="positiveCommunication"]')
const handcuffsApplied = () => cy.get('[data-qa=handcuffsApplied]')
const prisonerCompliant = () => cy.get('[data-qa="compliancy"]')
const photosTaken = () => cy.get('[data-qa="photographs"]')
const painInducingTechniquesUsed = () => cy.get('[data-qa=painInducingTechniquesUsed]')
const reasonsForUseOfForce = () => cy.get('[data-qa="reasonsForUseOfForce"')
const primaryReasonForUseOfForce = () => cy.get('[data-qa="primaryReason"')

module.exports = {
  useOfForcePlanned,
  authorisedBy,
  positiveCommunicationUsed,
  handcuffsApplied,
  prisonerCompliant,
  photosTaken,
  painInducingTechniquesUsed,
  prison,
  reasonsForUseOfForce,
  primaryReasonForUseOfForce,

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

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('body').then($body => {
      if ($body.find('[data-qa="staffInvolved"]').length > 0) {
        cy.get('[data-qa="staffInvolved"]')
          .first()
          .find('li')
          .then($listItems => {
            const staffPresent = $listItems.toArray().map(el => Cypress.$(el).text().trim())
            involvedStaff.forEach(staff => {
              expect(staffPresent).to.contain(staff)
            })
          })
      }
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(`[data-qa="staff-involved"]`)
      .find('td')
      .spread((...rest) => rest.map(element => Cypress.$(element).text().trim()))
      .then(staffPresent => {
        involvedStaff.forEach(staff => {
          expect(staffPresent).contain(staff)
        })
      })

    cy.get('[data-qa="witnesses"]').contains('Witness A').contains('Tom Jones')

    reasonsForUseOfForce().contains('Fight between prisoners')
    primaryReasonForUseOfForce().should('not.exist')

    positiveCommunicationUsed().contains('Yes')
    cy.get('[data-qa="personalProtection"]').contains('Yes')
    cy.get('[data-qa="batonDrawnAgainstPrisoner"]').contains('Yes and used')
    cy.get('[data-qa="pavaDrawnAgainstPrisoner"]').contains('Yes and used')
    cy.get('[data-qa="guidingHold"]').contains('Yes - 2 officers involved')
    cy.get('[data-qa="escortingHold"]').contains('Yes')
    cy.get('[data-qa="restraintUsed"]').contains('Standing')
    cy.get('[data-qa="restraintUsed"]').contains('On back (supine)')
    cy.get('[data-qa="restraintUsed"]').contains('On front (prone)')
    cy.get('[data-qa="restraintUsed"]').contains('Kneeling')
    handcuffsApplied().contains('Yes')
    cy.get('[data-qa="painInducingTechniques"]').contains('Wrist flexion, thumb lock')

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
