const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')

context('Report use of force page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubPrison', 'MDI')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
  })

  it('Progress of report is tracked as parts are filled in', () => {
    cy.login(bookingId)

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    reportUseOfForcePage.offenderName().contains('Norman Smith')
    reportUseOfForcePage.dob().contains('26 December 2000')
    reportUseOfForcePage.nomisId().contains('A1234AC')
    reportUseOfForcePage.offenderImage().should('be.visible')

    reportUseOfForcePage.checkNoPartsComplete()
    reportUseOfForcePage.checkYourAnswersLink().should('not.exist')
    const incidentDetailPage = reportUseOfForcePage.startNewForm()
    incidentDetailPage.fillForm()

    const useOfForceDetailsPage = incidentDetailPage.save()
    useOfForceDetailsPage.saveAndReturnToUseOfForce()

    const reportUseOfForcePageRevisited = ReportUseOfForcePage.verifyOnPage()
    reportUseOfForcePageRevisited.checkParts({
      newIncident: 'COMPLETE',
      details: 'INCOMPLETE',
      relocationAndInjuries: 'NOT_STARTED',
      evidence: 'NOT_STARTED',
    })

    const useOfForceDetailsPageRevisited = reportUseOfForcePageRevisited.goToUseOfForceDetailsPage()
    useOfForceDetailsPageRevisited.fillForm()
    const relocationPage = useOfForceDetailsPageRevisited.save()
    relocationPage.fillForm()
    const evidencePage = relocationPage.save()
    evidencePage.fillForm()
    evidencePage.save()

    const reportUseOfForcePageAfterAllPartsComplete = ReportUseOfForcePage.visit(bookingId)
    reportUseOfForcePageAfterAllPartsComplete.checkAllPartsComplete()
    reportUseOfForcePageAfterAllPartsComplete.checkYourAnswersLink().should('exist')
  })
})
