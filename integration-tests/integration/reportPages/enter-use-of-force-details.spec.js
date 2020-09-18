const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')

context('Submitting use of force details page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES'])
  })

  const fillFormAndSave = ({ restraintPositions = ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'] } = {}) => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.fillForm()
    const useOfForceDetailsPage = incidentDetailsPage.save()
    useOfForceDetailsPage.postiveCommunication().check('true')
    useOfForceDetailsPage.personalProtectionTechniques().check('true')
    useOfForceDetailsPage.batonDrawn().check('true')
    useOfForceDetailsPage.batonUsed().check('true')
    useOfForceDetailsPage.pavaDrawn().check('true')
    useOfForceDetailsPage.pavaUsed().check('true')
    useOfForceDetailsPage.guidingHold().check('true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.check('2')
    useOfForceDetailsPage.restraint().check('true')
    useOfForceDetailsPage.restraintPositions.check(restraintPositions)
    useOfForceDetailsPage.handcuffsApplied().check('true')
    useOfForceDetailsPage.painInducingTechniques().check('true')
    const relocationAndInjuriesPage = useOfForceDetailsPage.save()
    return relocationAndInjuriesPage
  }

  it('Details data is saved correctly', () => {
    cy.login()

    fillFormAndSave()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'useOfForceDetails' }).then(({ section }) => {
      expect(section).to.deep.equal({
        batonDrawn: true,
        batonUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        handcuffsApplied: true,
        pavaDrawn: true,
        pavaUsed: true,
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraint: true,
        restraintPositions: ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'],
        painInducingTechniques: true,
      })
    })
  })

  it('Single position is stored correctly', () => {
    cy.login()

    fillFormAndSave({ restraintPositions: ['STANDING'] })

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'useOfForceDetails' }).then(({ section }) => {
      expect(section).to.deep.equal({
        batonDrawn: true,
        batonUsed: true,
        guidingHold: true,
        guidingHoldOfficersInvolved: 2,
        handcuffsApplied: true,
        pavaDrawn: true,
        pavaUsed: true,
        personalProtectionTechniques: true,
        positiveCommunication: true,
        restraint: true,
        restraintPositions: ['STANDING'],
        painInducingTechniques: true,
      })
    })
  })

  it('Can revisit saved data', () => {
    cy.login()

    fillFormAndSave({ restraintPositions: ['STANDING', 'KNEELING'] })
    cy.go('back')

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.postiveCommunication().should('have.value', 'true')
    useOfForceDetailsPage.personalProtectionTechniques().should('have.value', 'true')
    useOfForceDetailsPage.batonDrawn().should('have.value', 'true')
    useOfForceDetailsPage.batonUsed().should('have.value', 'true')
    useOfForceDetailsPage.pavaDrawn().should('have.value', 'true')
    useOfForceDetailsPage.pavaUsed().should('have.value', 'true')
    useOfForceDetailsPage.guidingHold().should('have.value', 'true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.two().should('be.checked')
    useOfForceDetailsPage.restraint().should('have.value', 'true')
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
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.fillForm()
    const useOfForceDetailsPage = incidentDetailsPage.save()
    useOfForceDetailsPage.postiveCommunication().check('true')
    useOfForceDetailsPage.personalProtectionTechniques().check('true')
    useOfForceDetailsPage.pavaDrawn().check('true')
    useOfForceDetailsPage.pavaUsed().check('true')
    useOfForceDetailsPage.guidingHold().check('true')
    useOfForceDetailsPage.guidingHoldOfficersInvolved.check('2')
    useOfForceDetailsPage.restraint().check('false')
    useOfForceDetailsPage.handcuffsApplied().check('true')
    useOfForceDetailsPage.painInducingTechniques().check('true')
    useOfForceDetailsPage.clickSave()
    useOfForceDetailsPage.errorSummary().contains('Select yes if a baton was drawn')
  })
})
