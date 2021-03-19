const { offender } = require('../../mockApis/data')
const RelocationAndInjuries = require('../../pages/createReport/relocationAndInjuriesPage')

let relocationAndInjuries
context('Submitting use of force details page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubUserDetailsRetrieval', ['TEST_USER', 'MR_ZAGATO', 'MRS_JONES'])
    cy.login()
    cy.visit('/report/1001/relocation-and-injuries')
    relocationAndInjuries = RelocationAndInjuries.verifyOnPage()
  })

  const fillFormAndSave = () => {
    relocationAndInjuries.prisonerRelocation().select('Segregation unit')
    relocationAndInjuries.prisonerCompliant().check('true')
    relocationAndInjuries.f213CompletedBy().type('Dr Taylor')
    relocationAndInjuries.prisonerInjuries().check('true')
    relocationAndInjuries.healthcareInvolved().check('true')
    relocationAndInjuries.healthcarePractionerName().type('Dr Smith')
    relocationAndInjuries.prisonerHospitalisation().check('true')
    relocationAndInjuries.staffMedicalAttention().check('true')
    relocationAndInjuries.staffNeedingMedicalAttentionName0().type('Dan Smith')
    relocationAndInjuries.staffNeedingMedicalAttentionHospitalisation0().check('false')
    relocationAndInjuries.addAnother().click()
    relocationAndInjuries.staffNeedingMedicalAttentionName1().type('Eddie Thomas')
    relocationAndInjuries.staffNeedingMedicalAttentionHospitalisation1().check('true')
    relocationAndInjuries.addAnother().click()
    relocationAndInjuries.staffNeedingMedicalAttentionName2().type('Jayne Eyre')
    relocationAndInjuries.staffNeedingMedicalAttention2().check('true')
    relocationAndInjuries.removeStaffNeedingMedicalAttention().eq(0).click()
  }

  it('Relocation and Injuries data is saved correctly', () => {
    fillFormAndSave()
    relocationAndInjuries.clickSaveAndContinue()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'relocationAndInjuries' }).then(
      ({ section }) => {
        expect(section).to.deep.equal({
          prisonerRelocation: 'SEGREGATION_UNIT',
          relocationCompliancy: true,
          healthcareInvolved: true,
          f213CompletedBy: 'Dr Taylor',
          prisonerInjuries: true,
          healthcarePractionerName: 'Dr Smith',
          prisonerHospitalisation: true,
          staffMedicalAttention: true,
          staffNeedingMedicalAttention: [
            {
              name: 'Eddie Thomas',
              hospitalisation: true,
            },
            {
              name: 'Jayne Eyre',
              hospitalisation: true,
            },
          ],
        })
      }
    )
  })

  it('Compliancy of "No" and "PRIMARY" is stored correctly', () => {
    fillFormAndSave()
    relocationAndInjuries.prisonerCompliant().check('false')
    relocationAndInjuries.relocationType().check('PRIMARY')
    relocationAndInjuries.userSpecifiedRelocationType().should('not.be.visible')
    relocationAndInjuries.clickSaveAndContinue()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'relocationAndInjuries' }).then(
      ({ section }) => {
        expect(section).to.deep.equal({
          prisonerRelocation: 'SEGREGATION_UNIT',
          relocationCompliancy: false,
          relocationType: 'PRIMARY',
          healthcareInvolved: true,
          f213CompletedBy: 'Dr Taylor',
          prisonerInjuries: true,
          healthcarePractionerName: 'Dr Smith',
          prisonerHospitalisation: true,
          staffMedicalAttention: true,
          staffNeedingMedicalAttention: [
            {
              name: 'Eddie Thomas',
              hospitalisation: true,
            },
            {
              name: 'Jayne Eyre',
              hospitalisation: true,
            },
          ],
        })
      }
    )
  })

  it('Compliancy of "No" and "OTHER" is stored correctly', () => {
    fillFormAndSave()
    relocationAndInjuries.prisonerCompliant().check('false')
    relocationAndInjuries.relocationType().check('OTHER')
    relocationAndInjuries.userSpecifiedRelocationType().type('moved to another location')
    relocationAndInjuries.clickSaveAndContinue()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'relocationAndInjuries' }).then(
      ({ section }) => {
        expect(section).to.deep.equal({
          prisonerRelocation: 'SEGREGATION_UNIT',
          relocationCompliancy: false,
          relocationType: 'OTHER',
          userSpecifiedRelocationType: 'moved to another location',
          healthcareInvolved: true,
          f213CompletedBy: 'Dr Taylor',
          prisonerInjuries: true,
          healthcarePractionerName: 'Dr Smith',
          prisonerHospitalisation: true,
          staffMedicalAttention: true,
          staffNeedingMedicalAttention: [
            {
              name: 'Eddie Thomas',
              hospitalisation: true,
            },
            {
              name: 'Jayne Eyre',
              hospitalisation: true,
            },
          ],
        })
      }
    )
  })

  it('Displays validation messages', () => {
    fillFormAndSave()
    relocationAndInjuries.prisonerCompliant().check('false')
    relocationAndInjuries.relocationType().check('OTHER')
    relocationAndInjuries.clickSaveAndContinue()
    relocationAndInjuries.errorSummary().contains('Enter the type of relocation')
  })
})
