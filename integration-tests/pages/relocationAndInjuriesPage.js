const page = require('./page')
const evidencePage = require('./evidencePage')

export default () =>
  page('Relocation and injuries', {
    fillForm: () => {
      cy.get('[name="prisonerRelocation"]').select('segregationUnit')
      cy.get('[name="prisonerCompliancy"]').select('compliant')
      cy.get('[name="healthcareInvolved"]').check('yes')
      cy.get('[name="healthcarePractionerName"]').type('Dr Smith')
      cy.get('[name="prisonerInjuries"]').check('yes')
      cy.get('[name="f213CompletedBy"]').type('Dr Taylor')
      cy.get('[name="prisonerHospitalisation"]').check('yes')
    },
    save: () => {
      cy.get('[data-next]').click()
      return evidencePage()
    },
  })
