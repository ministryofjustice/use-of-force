const TasklistPage = require('../../pages/tasklistPage')
const IncidentsPage = require('../../pages/incidentsPage')
const SubmittedPage = require('../../pages/submittedPage')

context('Submit the incident report', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'Test User')
    cy.task('stubUserDetailsRetrieval', 'MR ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS JONES')
  })

  it('A form cannot be submitted until confirmed', () => {
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
              { name: 'MR ZAGATO name', email: 'MR ZAGATO@gov.uk', userid: 'MR ZAGATO', status: 'PENDING' },
              { name: 'MRS JONES name', email: 'MRS JONES@gov.uk', userid: 'MRS JONES', status: 'PENDING' },
              { name: 'Test User name', email: 'Test User@gov.uk', userid: 'Test User', status: 'PENDING' },
            ])
          )
      )
  })

  it('Can defer submitting form', () => {
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

    checkAnswersPage.backToTasklist().click()

    TasklistPage.verifyOnPage()
  })

  it('After submitting, can not resubmit, go on to view all incidents', () => {
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

    SubmittedPage.verifyOnPage()

    cy.go('back')

    IncidentsPage.verifyOnPage()
  })
})
