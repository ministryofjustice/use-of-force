const TasklistPage = require('../../pages/tasklistPage')
const SubmittedPage = require('../../pages/submittedPage')

context('Logging in', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'Mr Zagato')
    cy.task('stubUserDetailsRetrieval', 'Mrs Jones')
    cy.task('stubUserDetailsRetrieval', 'Test User')
  })

  it('After submitting a report, A user has the ability to start a new report', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationAndInjuriesPage = detailsPage.save()
    relocationAndInjuriesPage.fillForm()
    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.fillForm()
    let checkAnswersPage = evidencePage.save()
    checkAnswersPage.verifyInputs()

    const tasklistPageAfterAllPartsComplete = TasklistPage.visit(bookingId)
    tasklistPageAfterAllPartsComplete.checkAllPartsComplete()

    checkAnswersPage = tasklistPageAfterAllPartsComplete.goToAnswerPage()
    checkAnswersPage.confirm()
    checkAnswersPage.clickSubmit()
    SubmittedPage.verifyOnPage()

    const tasklistPageForSubmittedForm = TasklistPage.visit(bookingId)
    tasklistPageForSubmittedForm.checkNoPartsComplete()
  })
})
