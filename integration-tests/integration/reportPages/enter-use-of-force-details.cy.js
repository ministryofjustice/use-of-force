const { use } = require('passport')
const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')

context('Enter use of force details page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubUserDetailsRetrieval', ['TEST_USER', 'MR_ZAGATO', 'MRS_JONES'])
  })

  const fillFormAndSave = ({ restraintPositions = ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'] } = {}) => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.clickSaveAndContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.positiveCommunication().check('true')
    useOfForceDetailsPage.bodyWornCamera().check('YES')
    useOfForceDetailsPage.bodyWornCameraNumber(0).type('123')
    useOfForceDetailsPage.addAnotherBodyWornCamera()
    useOfForceDetailsPage.bodyWornCameraNumber(1).type('345')
    useOfForceDetailsPage.removeBodyWornCamera(0)
    useOfForceDetailsPage.personalProtectionTechniques().check('true')
    useOfForceDetailsPage.batonDrawn().check('true')
    useOfForceDetailsPage.batonUsed().check('true')
    useOfForceDetailsPage.pavaDrawn().check('true')
    useOfForceDetailsPage.pavaUsed().check('true')
    useOfForceDetailsPage.guidingHold().check('true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.check('2')
    useOfForceDetailsPage.escortingHold().check('true')
    useOfForceDetailsPage.restraintPositions.check(restraintPositions)
    useOfForceDetailsPage.handcuffsApplied().check('true')
    useOfForceDetailsPage.painInducingTechniques().check('true')
    useOfForceDetailsPage.painInducingTechniquesUsed.check(['THUMB_LOCK', 'THROUGH_RIGID_BAR_CUFFS'])
    const relocationAndInjuriesPage = useOfForceDetailsPage.save()
    return relocationAndInjuriesPage
  }

  it('Details data is saved correctly', () => {
    cy.login()

    fillFormAndSave()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'useOfForceDetails' }).then(({ section }) => {
      expect(section).to.deep.equal({
        bodyWornCamera: 'YES',
        bodyWornCameraNumbers: [{ cameraNum: '345' }],
        batonDrawn: true,
        batonUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        handcuffsApplied: true,
        pavaDrawn: true,
        pavaUsed: true,
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraintPositions: ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'],
        painInducingTechniques: true,
        painInducingTechniquesUsed: ['THROUGH_RIGID_BAR_CUFFS', 'THUMB_LOCK'],
      })
    })
  })

  it('Single position is stored correctly', () => {
    cy.login()

    fillFormAndSave({ restraintPositions: ['STANDING'] })

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'useOfForceDetails' }).then(({ section }) => {
      expect(section).to.deep.equal({
        bodyWornCamera: 'YES',
        bodyWornCameraNumbers: [{ cameraNum: '345' }],
        batonDrawn: true,
        batonUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        handcuffsApplied: true,
        pavaDrawn: true,
        pavaUsed: true,
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraintPositions: 'STANDING',
        painInducingTechniques: true,
        painInducingTechniquesUsed: ['THROUGH_RIGID_BAR_CUFFS', 'THUMB_LOCK'],
      })
    })
  })

  it('Can revisit saved data', () => {
    cy.login()

    fillFormAndSave({ restraintPositions: ['STANDING', 'KNEELING'] })
    cy.go('back')

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.positiveCommunication().should('have.value', 'true')
    useOfForceDetailsPage.bodyWornCamera().should('have.value', 'YES')
    useOfForceDetailsPage.bodyWornCameraNumber(0).should('have.value', '345')
    useOfForceDetailsPage.personalProtectionTechniques().should('have.value', 'true')
    useOfForceDetailsPage.batonDrawn().should('have.value', 'true')
    useOfForceDetailsPage.batonUsed().should('have.value', 'true')
    useOfForceDetailsPage.pavaDrawn().should('have.value', 'true')
    useOfForceDetailsPage.pavaUsed().should('have.value', 'true')
    useOfForceDetailsPage.guidingHold().should('have.value', 'true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.two().should('be.checked')
    useOfForceDetailsPage.escortingHold().should('have.value', 'true')
    useOfForceDetailsPage.restraintPositions.standing().should('be.checked')
    useOfForceDetailsPage.restraintPositions.faceDown().should('not.be.checked')
    useOfForceDetailsPage.restraintPositions.kneeling().should('be.checked')
    useOfForceDetailsPage.restraintPositions.onBack().should('not.be.checked')
    useOfForceDetailsPage.handcuffsApplied().should('have.value', 'true')
    useOfForceDetailsPage.painInducingTechniques().should('have.value', 'true')
  })

  it('Displays validation messages', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.clickSaveAndContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.positiveCommunication().check('true')
    useOfForceDetailsPage.bodyWornCamera().check('YES')
    useOfForceDetailsPage.personalProtectionTechniques().check('true')
    useOfForceDetailsPage.pavaDrawn().check('true')
    useOfForceDetailsPage.pavaUsed().check('true')
    useOfForceDetailsPage.guidingHold().check('true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.check('2')
    useOfForceDetailsPage.escortingHold().check('true')
    useOfForceDetailsPage.handcuffsApplied().check('true')
    useOfForceDetailsPage.painInducingTechniques().check('true')
    useOfForceDetailsPage.clickSaveAndContinue()
    useOfForceDetailsPage.errorSummary().contains('Select yes if a baton was drawn')
    useOfForceDetailsPage.errorSummary().contains('Enter the body-worn camera number')
  })
})
