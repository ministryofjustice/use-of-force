import page from '../page'
import EvidencePage from './evidencePage'

const relocationAndInjuriesPage = () =>
  page('Relocation and injuries', {
    prisonerRelocation: () => cy.get('[name="prisonerRelocation"]'),
    prisonerCompliant: () => cy.get('[name="relocationCompliancy"]'),
    relocationType: () => cy.get('[name="relocationType"]'),
    userSpecifiedRelocationType: () => cy.get('[name="userSpecifiedRelocationType"]'),
    healthcareInvolved: () => cy.get('[name="healthcareInvolved"]'),
    healthcarePractionerName: () => cy.get('[name="healthcarePractionerName"]'),
    prisonerInjuries: () => cy.get('[name="prisonerInjuries"]'),
    f213CompletedBy: () => cy.get('[name="f213CompletedBy"]'),
    prisonerHospitalisation: () => cy.get('[name="prisonerHospitalisation"]'),
    staffMedicalAttention: () => cy.get('[name="staffMedicalAttention"]'),
    staffNeedingMedicalAttentionName0: () => cy.get('[name="staffNeedingMedicalAttention[0][name]"]'),
    staffNeedingMedicalAttentionHospitalisation0: () =>
      cy.get('[name="staffNeedingMedicalAttention[0][hospitalisation]"]'),
    addAnother: () => cy.get('[data-qa-add-another-staff-needing-medical-attention = true]'),
    staffNeedingMedicalAttentionName1: () => cy.get('[name="staffNeedingMedicalAttention[1][name]"]'),
    staffNeedingMedicalAttentionHospitalisation1: () =>
      cy.get('[name="staffNeedingMedicalAttention[1][hospitalisation]"]'),
    staffNeedingMedicalAttentionName2: () => cy.get('[name="staffNeedingMedicalAttention[2][name]"]'),
    staffNeedingMedicalAttention2: () => cy.get('[name="staffNeedingMedicalAttention[2][hospitalisation]"]'),
    removeStaffNeedingMedicalAttention: () =>
      cy.get('.add-another-staff-needing-medical-attention .add-another__remove-button'),

    fillForm() {
      this.prisonerRelocation().select('Segregation unit')
      this.prisonerCompliant().check('true')
      this.healthcareInvolved().check('true')
      this.healthcarePractionerName().type('Dr Smith')
      this.prisonerInjuries().check('true')
      this.f213CompletedBy().type('Dr Taylor')
      this.prisonerHospitalisation().check('true')
      this.staffMedicalAttention().check('true')
      this.staffNeedingMedicalAttentionName0().type('Dan Smith')
      this.staffNeedingMedicalAttentionHospitalisation0().check('false')
      this.addAnother().click()
      this.staffNeedingMedicalAttentionName1().type('Eddie Thomas')
      this.staffNeedingMedicalAttentionHospitalisation1().check('true')
      this.addAnother().click()
      this.staffNeedingMedicalAttentionName2().type('Jayne Eyre')
      this.staffNeedingMedicalAttention2().check('true')
      this.removeStaffNeedingMedicalAttention().eq(0).click()
    },
    errorSummary() {
      return cy.get('.govuk-error-summary')
    },
    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return EvidencePage.verifyOnPage()
    },
    clickSaveAndContinue: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickSave: () => cy.get('[data-qa="save"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
  })

module.exports = { verifyOnPage: relocationAndInjuriesPage }
