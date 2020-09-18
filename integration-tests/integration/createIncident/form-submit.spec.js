const { offender } = require('../../mockApis/data')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const ReportSentPage = require('../../pages/createReport/reportSentPage')
const { ReportStatus } = require('../../../server/config/types')
const { expectedPayload } = require('../seedData')

context('Submit the incident report', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('Submitting a form', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.fillForm()
    const detailsPage = incidentDetailsPage.save()
    detailsPage.fillForm()
    const relocationAndInjuriesPage = detailsPage.save()
    relocationAndInjuriesPage.fillForm()
    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.fillForm()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.clickSubmit()
    const reportSentPage = ReportSentPage.verifyOnPage()

    reportSentPage.getReportId().then(reportId =>
      cy.task('getAllStatementsForReport', reportId).then(staff =>
        expect(staff).to.deep.equal([
          {
            name: 'MR_ZAGATO name',
            email: 'MR_ZAGATO@gov.uk',
            userid: 'MR_ZAGATO',
            status: 'PENDING',
          },
          {
            name: 'MRS_JONES name',
            email: 'MRS_JONES@gov.uk',
            userid: 'MRS_JONES',
            status: 'PENDING',
          },
          {
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
            userid: 'TEST_USER',
            status: 'PENDING',
          },
        ])
      )
    )

    reportSentPage
      .getReportId()
      .then(reportId => cy.task('getReport', reportId).then(report => expect(report).to.deep.equal(expectedPayload)))
  })

  it('After submitting, can not resubmit', () => {
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    let reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    let checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    checkAnswersPage.backToTasklist().click()

    reportUseOfForcePage = ReportUseOfForcePage.verifyOnPage()

    checkAnswersPage = reportUseOfForcePage.goToAnswerPage()
    checkAnswersPage.clickSubmit()

    ReportSentPage.verifyOnPage()

    cy.go('back')

    YourStatementsPage.verifyOnPage()
  })

  it('Can exit after completing report and before creating statement', () => {
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    checkAnswersPage.clickSubmit()

    ReportSentPage.verifyOnPage().exit().click()

    // Exit location is configurable - in dev this points to / which for this user redirects to 'Your statements'
    YourStatementsPage.verifyOnPage()
  })
})
