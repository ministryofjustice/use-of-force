const TasklistPage = require('../../pages/tasklistPage')

context('tasklist', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'Test User')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
  })

  it('Progress of report is tracked as parts are filled in', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.offenderName().contains('Norman Smith')
    tasklistPage.dob().contains('26 December 2000')
    tasklistPage.nomisId().contains('A1234AC')
    tasklistPage.offenderImage().should('be.visible')

    tasklistPage.checkNoPartsComplete()
    tasklistPage.checkYourAnswersLink().should('not.exist')
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()

    const detailsPage = newIncidentPage.save()
    detailsPage.saveAndReturnToUseOfForce()

    const tasklistPageRevisited = TasklistPage.verifyOnPage()
    tasklistPageRevisited.checkParts({
      newIncident: 'COMPLETE',
      details: 'INCOMPLETE',
      relocationAndInjuries: 'NOT_STARTED',
      evidence: 'NOT_STARTED',
    })

    const detailsPageRevisited = tasklistPageRevisited.goToUseOfForceDetailsPage()
    detailsPageRevisited.fillForm()
    const relocationPage = detailsPageRevisited.save()
    relocationPage.fillForm()
    const evidencePage = relocationPage.save()
    evidencePage.fillForm()
    evidencePage.save()

    const tasklistPageAfterAllPartsComplete = TasklistPage.visit(bookingId)
    tasklistPageAfterAllPartsComplete.checkAllPartsComplete()
    tasklistPage.checkYourAnswersLink().should('exist')
  })
})
