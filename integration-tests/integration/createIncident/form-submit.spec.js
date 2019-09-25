const TasklistPage = require('../../pages/tasklistPage')
const YourStatementsPage = require('../../pages/yourStatementsPage')
const SubmittedPage = require('../../pages/submittedPage')
const { ReportStatus } = require('../../../server/config/types')
const { expectedPayload } = require('../seedData')

context('Submit the incident report', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
  })

  it('Submitting a form', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationAndInjuriesPage = detailsPage.save()
    relocationAndInjuriesPage.fillForm()
    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.fillForm()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.clickSubmit()
    const submittedPage = SubmittedPage.verifyOnPage()

    submittedPage
      .getReportId()
      .then(reportId =>
        cy
          .task('getAllStatementsForReport', reportId)
          .then(staff =>
            expect(staff).to.deep.equal([
              { name: 'MR_ZAGATO name', email: 'MR_ZAGATO@gov.uk', userid: 'MR_ZAGATO', status: 'PENDING' },
              { name: 'MRS_JONES name', email: 'MRS_JONES@gov.uk', userid: 'MRS_JONES', status: 'PENDING' },
              { name: 'TEST_USER name', email: 'TEST_USER@gov.uk', userid: 'TEST_USER', status: 'PENDING' },
            ])
          )
      )

    submittedPage
      .getReportId()
      .then(reportId => cy.task('getPayload', reportId).then(payload => expect(payload).to.deep.equal(expectedPayload)))
  })

  it('After submitting, can not resubmit, go on to view all incidents', () => {
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    let tasklistPage = TasklistPage.visit(bookingId)
    let checkAnswersPage = tasklistPage.goToAnswerPage()

    checkAnswersPage.backToTasklist().click()

    tasklistPage = TasklistPage.verifyOnPage()

    checkAnswersPage = tasklistPage.goToAnswerPage()
    checkAnswersPage.clickSubmit()

    SubmittedPage.verifyOnPage()

    cy.go('back')

    YourStatementsPage.verifyOnPage()
  })

  it('Can exit after completing report and before creating statement', () => {
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    const tasklistPage = TasklistPage.visit(bookingId)
    const checkAnswersPage = tasklistPage.goToAnswerPage()

    checkAnswersPage.clickSubmit()

    SubmittedPage.verifyOnPage()
      .exit()
      .click()

    // Exit location is configurable - in dev this points to / which for this user redirects to 'Your statements'
    YourStatementsPage.verifyOnPage()
  })
})
