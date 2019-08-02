const page = require('./page')
const evidencePage = require('./evidencePage')

export default () =>
  page('Relocation and injuries', {
    fillForm: () => {
      cy.get('[name="prisonerRelocation"]').select('Segregation unit')
      cy.get('[name="relocationCompliancy"]').check('compliant')
      cy.get('[name="healthcareInvolved"]').check('Yes')
      cy.get('[name="healthcarePractionerName"]').type('Dr Smith')
      cy.get('[name="prisonerInjuries"]').check('Yes')
      cy.get('[name="f213CompletedBy"]').type('Dr Taylor')
      cy.get('[name="prisonerHospitalisation"]').check('Yes')
      cy.get('[name="staffMedicalAttention"]').check('Yes')
      cy.get('[name="staffNeedingMedicalAttention[0][name]"]').type('Dan Smith')
      cy.get('[name="staffNeedingMedicalAttention[0][hospitalisation]"]').check('No')
      cy.get('[data-qa-add-another-staff-needing-medical-attention = true]').click()
      cy.get('[name="staffNeedingMedicalAttention[1][name]"]').type('Eddie Thomas')
      cy.get('[name="staffNeedingMedicalAttention[1][hospitalisation]"]').check('Yes')
      cy.get('[data-qa-add-another-staff-needing-medical-attention = true]').click()
      cy.get('[name="staffNeedingMedicalAttention[2][name]"]').type('Jayne Eyre')
      cy.get('[name="staffNeedingMedicalAttention[2][hospitalisation]"]').check('Yes')
      cy.get('.add-another-staff-needing-medical-attention > :nth-child(1) > .govuk-button').click()
    },
    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return evidencePage()
    },
  })
