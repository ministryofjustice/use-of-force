const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')

context('Report use of force page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrisons')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('Progress of report is tracked as parts are filled in', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    reportUseOfForcePage.offenderName().contains('Norman Smith')
    reportUseOfForcePage.dob().contains('26 December 2000')
    reportUseOfForcePage.nomisId().contains('A1234AC')
    reportUseOfForcePage.offenderImage().should('be.visible')

    reportUseOfForcePage.checkNoPartsComplete()
    reportUseOfForcePage.checkYourAnswersLink().should('not.exist')
    const incidentDetailPage = reportUseOfForcePage.startNewForm()
    incidentDetailPage.fillForm()

    const staffInvolvedPage = incidentDetailPage.save()
    staffInvolvedPage.noMoreToAdd().click()
    staffInvolvedPage.saveAndReturn()

    const reportUseOfForcePageRevisited = ReportUseOfForcePage.verifyOnPage()
    reportUseOfForcePageRevisited.checkParts({
      incidentDetails: 'COMPLETE',
      staffInvolved: 'COMPLETE',
      useOfForceDetails: 'NOT_STARTED',
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

    const reportUseOfForcePageAfterAllPartsComplete = ReportUseOfForcePage.visit(offender.bookingId)
    reportUseOfForcePageAfterAllPartsComplete.checkAllPartsComplete()
    reportUseOfForcePageAfterAllPartsComplete.checkYourAnswersLink().should('exist')
  })
})
