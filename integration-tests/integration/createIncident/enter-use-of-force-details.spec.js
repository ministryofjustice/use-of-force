const TasklistPage = require('../../pages/tasklistPage')
const useOfForceDetailsPageFactory = require('../../pages/detailsPage')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubUserDetailsRetrieval', 'Mr Zagato')
    cy.task('stubUserDetailsRetrieval', 'Mrs Jones')
  })

  const fillFormAndSave = ({ restraintPositions = ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'] } = {}) => {
    const tasklistPage = TasklistPage.visit(bookingId)
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.postiveCommunication().check('true')
    detailsPage.personalProtectionTechniques().check('true')
    detailsPage.batonDrawn().check('true')
    detailsPage.batonUsed().check('true')
    detailsPage.pavaDrawn().check('true')
    detailsPage.pavaUsed().check('true')
    detailsPage.guidingHold().check('true')
    detailsPage.guidingHoldOfficersInvolved.check('2')
    detailsPage.restraint().check('true')
    detailsPage.restraintPositions.check(restraintPositions)
    detailsPage.handcuffsApplied().check('true')
    const relocationAndInjuriesPage = detailsPage.save()
    return relocationAndInjuriesPage
  }

  it('Details data is saved correctly', () => {
    cy.login(bookingId)

    fillFormAndSave()

    cy.task('getCurrentDraft', { bookingId, formName: 'details' }).then(({ payload }) => {
      expect(payload).to.deep.equal({
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
      })
    })
  })

  it('Single position is stored correctly', () => {
    cy.login(bookingId)

    fillFormAndSave({ restraintPositions: ['STANDING'] })

    cy.task('getCurrentDraft', { bookingId, formName: 'details' }).then(({ payload }) => {
      expect(payload).to.deep.equal({
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
      })
    })
  })

  it('Can revisit saved data', () => {
    cy.login(bookingId)

    const relocationAndInjuriesPage = fillFormAndSave({ restraintPositions: ['STANDING', 'KNEELING'] })
    relocationAndInjuriesPage.back().click()

    const detailsPage = useOfForceDetailsPageFactory()
    detailsPage.postiveCommunication().should('have.value', 'true')
    detailsPage.personalProtectionTechniques().should('have.value', 'true')
    detailsPage.batonDrawn().should('have.value', 'true')
    detailsPage.batonUsed().should('have.value', 'true')
    detailsPage.pavaDrawn().should('have.value', 'true')
    detailsPage.pavaUsed().should('have.value', 'true')
    detailsPage.guidingHold().should('have.value', 'true')
    detailsPage.guidingHoldOfficersInvolved.two().should('be.checked')
    detailsPage.restraint().should('have.value', 'true')
    detailsPage.restraintPositions.standing().should('be.checked')
    detailsPage.restraintPositions.faceDown().should('not.be.checked')
    detailsPage.restraintPositions.kneeling().should('be.checked')
    detailsPage.restraintPositions.onBack().should('not.be.checked')
    detailsPage.handcuffsApplied().should('have.value', 'true')
  })
})
