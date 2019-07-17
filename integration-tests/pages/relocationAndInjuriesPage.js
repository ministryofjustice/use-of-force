const page = require('./page')
const evidencePage = require('./evidencePage')

export default () =>
  page('Relocation and injuries', {
    fillForm: () => {
      cy.get('[name="prisonerRelocation"]').select('Segregation unit')
      cy.get('[name="relocationCompliancy"]').select('compliant')
      cy.get('[name="healthcareInvolved"]').check('Yes')
      cy.get('[name="healthcarePractionerName"]').type('Dr Smith')
      cy.get('[name="prisonerInjuries"]').check('Yes')
      cy.get('[name="f213CompletedBy"]').type('Dr Taylor')
      cy.get('[name="prisonerHospitalisation"]').check('Yes')
      cy.get('[name="staffMedicalAttention"]').check('Yes')
      cy.get('[name="staffMemberNeedingMedicalAttention[0][name]"]').type('Dan Smith')
      cy.get('[name="staffMemberWentToHospital[0][name]"]').check('No')
      cy.get('[data-qa-add-another-staff-needing-medical-attention = true]').click()
      cy.get('[name="staffMemberNeedingMedicalAttention[1][name]"]').type('Eddie Thomas')
      cy.get('[name="staffMemberWentToHospital[1][name]"]').check('Yes')
      cy.get('[data-qa-add-another-staff-needing-medical-attention = true]').click()
      cy.get('[name="staffMemberNeedingMedicalAttention[2][name]"]').type('Tommy Smith')
      cy.get('[name="staffMemberWentToHospital[2][name]"]').check('No')
      cy.get(':nth-child(1) > .govuk-button').click()
    },
    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return evidencePage()
    },
  })
