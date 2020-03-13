const page = require('../page')
const EvidencePage = require('./evidencePage')

const relocationAndInjuriesPage = () =>
  page('Relocation and injuries', {
    prisonerCompliant: () => cy.get('[name="prisonerCompliant"]'),
    relocationType: () => cy.get('[name="relocationType"]'),
    fillForm() {
      cy.get('[name="prisonerRelocation"]').select('Segregation unit')
      this.prisonerCompliant().check('true')
      cy.get('[name="healthcareInvolved"]').check('true')
      cy.get('[name="healthcarePractionerName"]').type('Dr Smith')
      cy.get('[name="prisonerInjuries"]').check('true')
      cy.get('[name="f213CompletedBy"]').type('Dr Taylor')
      cy.get('[name="prisonerHospitalisation"]').check('true')
      cy.get('[name="staffMedicalAttention"]').check('true')
      cy.get('[name="staffNeedingMedicalAttention[0][name]"]').type('Dan Smith')
      cy.get('[name="staffNeedingMedicalAttention[0][hospitalisation]"]').check('false')
      cy.get('[data-qa-add-another-staff-needing-medical-attention = true]').click()
      cy.get('[name="staffNeedingMedicalAttention[1][name]"]').type('Eddie Thomas')
      cy.get('[name="staffNeedingMedicalAttention[1][hospitalisation]"]').check('true')
      cy.get('[data-qa-add-another-staff-needing-medical-attention = true]').click()
      cy.get('[name="staffNeedingMedicalAttention[2][name]"]').type('Jayne Eyre')
      cy.get('[name="staffNeedingMedicalAttention[2][hospitalisation]"]').check('true')
      cy.get('.add-another-staff-needing-medical-attention .add-another__remove-button')
        .eq(0)
        .click()
    },
    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return EvidencePage.verifyOnPage()
    },
    clickSave: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
  })

export default { verifyOnPage: relocationAndInjuriesPage }
