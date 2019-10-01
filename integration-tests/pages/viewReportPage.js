const page = require('./page')

const viewReportPage = () =>
  page('Use of force report', {
    reporterName: () => cy.get('[data-qa="reporter-name"]'),

    submittedDate: () => cy.get('[data-qa="submitted-date"]'),

    prisonerName: () => cy.get('[data-qa="prisoner-name"]'),

    prisonNumber: () => cy.get('[data-qa="prison-number"]'),

    incidentNumber: () => cy.get('[data-qa="incident-number"]'),

    verifyInputs: ({ involvedStaff = ['MR_ZAGATO', 'MRS_JONES'] } = {}) => {
      cy.get('[data-qa="incidentDate"]')
        .invoke('text')
        .invoke('trim')
        .should('match', /\d{1,2} .* \d{4}/)
      cy.get('[data-qa="incidentTime"]')
        .invoke('text')
        .invoke('trim')
        .should('match', /\d{2}:\d{2}/)
      cy.get('[data-qa="location"]').contains('ASSO A Wing')
      cy.get('[data-qa="incidentType"]').contains('Yes')
      involvedStaff.forEach(staff => {
        cy.get('[data-qa="staffInvolved"]').contains(staff)
      })
      cy.get('[data-qa="witnesses"]')
        .contains('Witness A')
        .contains('Tom Jones')
      cy.get('[data-qa="positiveCommunication"]').contains('Yes')
      cy.get('[data-qa="personalProtection"]').contains('Yes')
      cy.get('[data-qa="batonDrawn"]').contains('Yes and used')
      cy.get('[data-qa="pavaDrawn"]').contains('Yes and used')
      cy.get('[data-qa="guidingHold"]').contains('Yes - 2 officers involved')
      cy.get('[data-qa="restraintUsed"]').contains('Yes - standing, on back, face down, kneeling')

      cy.get('[data-qa="prisonerRelocation"]').contains('Segregation unit')
      cy.get('[data-qa="compliancy"]').contains('Yes')
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
      cy.get('[data-qa="photographs"]').contains('Yes')
      cy.get('[data-qa="cctv"]').contains('Not known')
      cy.get('[data-qa="bodyCameras"]').contains('Yes - 123, 789, 456')
    },

    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*\/(.*)\/view-report/)
        return match[1]
      })
    },

    continue: () => cy.get('[data-qa="continue"]'),
  })

export default {
  verifyOnPage: viewReportPage,
}
