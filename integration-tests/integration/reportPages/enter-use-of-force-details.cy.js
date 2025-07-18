const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')

context('Enter use of force details page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
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
    useOfForceDetailsPage.batonDrawnAgainstPrisoner().check('true')
    useOfForceDetailsPage.batonUsed().check('true')
    useOfForceDetailsPage.pavaDrawnAgainstPrisoner().check('true')
    useOfForceDetailsPage.pavaUsed().check('true')
    useOfForceDetailsPage.taserDrawn().check('false')
    useOfForceDetailsPage.bittenByPrisonDog().check('false')
    useOfForceDetailsPage.weaponsObserved().check('NO')
    useOfForceDetailsPage.guidingHold().check('true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.check('2')
    useOfForceDetailsPage.escortingHold().check('true')
    useOfForceDetailsPage.restraintPositions.check(restraintPositions)
    useOfForceDetailsPage.handcuffsApplied().check('true')
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
        batonDrawnAgainstPrisoner: true,
        batonUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        handcuffsApplied: true,
        pavaDrawnAgainstPrisoner: true,
        pavaUsed: true,
        taserDrawn: false,
        bittenByPrisonDog: false,
        weaponsObserved: 'NO',
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraintPositions: ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'],
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
        batonDrawnAgainstPrisoner: true,
        batonUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        escortingHold: true,
        handcuffsApplied: true,
        pavaDrawnAgainstPrisoner: true,
        weaponsObserved: 'NO',
        pavaUsed: true,
        taserDrawn: false,
        bittenByPrisonDog: false,
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraintPositions: 'STANDING',
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
    useOfForceDetailsPage.batonDrawnAgainstPrisoner().should('have.value', 'true')
    useOfForceDetailsPage.batonUsed().should('have.value', 'true')
    useOfForceDetailsPage.pavaDrawnAgainstPrisoner().should('have.value', 'true')
    useOfForceDetailsPage.pavaUsed().should('have.value', 'true')
    useOfForceDetailsPage.taserDrawnNo().should('be.checked')
    useOfForceDetailsPage.bittenByPrisonDogNo().should('be.checked')
    useOfForceDetailsPage.guidingHold().should('have.value', 'true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.two().should('be.checked')
    useOfForceDetailsPage.escortingHold().should('have.value', 'true')
    useOfForceDetailsPage.restraintPositions.standing().should('be.checked')
    useOfForceDetailsPage.restraintPositions.faceDown().should('not.be.checked')
    useOfForceDetailsPage.restraintPositions.kneeling().should('be.checked')
    useOfForceDetailsPage.restraintPositions.onBack().should('not.be.checked')
    useOfForceDetailsPage.handcuffsApplied().should('have.value', 'true')
    useOfForceDetailsPage.painInducingTechniquesUsed.throughRigidBarCuffs().should('be.checked')
    useOfForceDetailsPage.painInducingTechniquesUsed.thumbLock().should('be.checked')
  })

  it('Displays validation messages', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.clickSaveAndContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.positiveCommunication().check('true')
    useOfForceDetailsPage.personalProtectionTechniques().check('true')
    useOfForceDetailsPage.pavaDrawnAgainstPrisoner().check('true')
    useOfForceDetailsPage.pavaUsed().check('true')
    useOfForceDetailsPage.guidingHold().check('true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.check('2')
    useOfForceDetailsPage.escortingHold().check('true')
    useOfForceDetailsPage.handcuffsApplied().check('true')
    useOfForceDetailsPage.clickSaveAndContinue()
    useOfForceDetailsPage.errorSummary().contains('Select yes if a baton was drawn')
    useOfForceDetailsPage
      .errorSummary()
      .contains('Select yes if any part of the incident was captured on a body-worn camera')
    useOfForceDetailsPage.errorSummary().contains('Select if any pain inducing techniques were used')
    useOfForceDetailsPage.errorSummary().contains('Select yes if any weapons were observed')
    useOfForceDetailsPage.errorSummary().contains('Select yes if a Taser was drawn against the prisoner')
    useOfForceDetailsPage.errorSummary().contains('Select yes if the prisoner was bitten by a prison dog')
  })

  it('Displays secondary validation messages', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.clickSaveAndContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.positiveCommunication().check('true')
    useOfForceDetailsPage.bodyWornCamera().check('YES')
    useOfForceDetailsPage.personalProtectionTechniques().check('true')
    useOfForceDetailsPage.pavaDrawnAgainstPrisoner().check('true')
    useOfForceDetailsPage.pavaUsed().check('true')
    useOfForceDetailsPage.taserDrawn().check('true')
    useOfForceDetailsPage.bittenByPrisonDog().check('true')
    useOfForceDetailsPage.weaponsObserved().check('YES')
    useOfForceDetailsPage.guidingHold().check('true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.check('2')
    useOfForceDetailsPage.escortingHold().check('true')
    useOfForceDetailsPage.handcuffsApplied().check('true')
    useOfForceDetailsPage.clickSaveAndContinue()
    useOfForceDetailsPage.errorSummary().contains('Select yes if a baton was drawn')
    useOfForceDetailsPage.errorSummary().contains('Enter the body-worn camera number')
    useOfForceDetailsPage.errorSummary().contains('Select if any pain inducing techniques were used')
    useOfForceDetailsPage.errorSummary().contains('Enter the type of weapon observed')
    useOfForceDetailsPage.errorSummary().contains('Select yes if the prisoner was warned a Taser operative was present')
    useOfForceDetailsPage.errorSummary().contains('Select yes if a red-dot warning was used')
    useOfForceDetailsPage.errorSummary().contains('Select yes if a red-dot warning was used')
    useOfForceDetailsPage.errorSummary().contains('Select yes if an arc warning was used')
    useOfForceDetailsPage.errorSummary().contains('Select yes if the Taser was deployed')
    useOfForceDetailsPage.errorSummary().contains('Select yes if the Taser cycle was extended')
    useOfForceDetailsPage.errorSummary().contains('Select yes if the Taser was re-energised')
  })

  it('Displays validation messages when multiple inputs are not unique', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.clickSaveAndContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.bodyWornCamera().check('YES')
    useOfForceDetailsPage.bodyWornCameraNumber(0).type('1')
    useOfForceDetailsPage.addAnotherBodyWornCamera()
    useOfForceDetailsPage.bodyWornCameraNumber(1).type('1')
    useOfForceDetailsPage.clickSaveAndContinue()
    useOfForceDetailsPage.errorSummary().contains("Camera '1' has already been added - remove this camera")
  })
})
