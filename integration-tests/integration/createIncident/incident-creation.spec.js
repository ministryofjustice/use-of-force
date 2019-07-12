const TasklistPage = require('../../pages/tasklistPage')

context('Logging in', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
  })

  it('After submitting a report, A user has the ability to start a new report', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()
    const newIncidentPage = tasklistPage.startNewForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationPage = detailsPage.save()
    const evidencePage = relocationPage.save()
    const checkAnswersPage = evidencePage.save()
    checkAnswersPage.confirm()
    checkAnswersPage.submit()

    const tasklistPageForSubmittedForm = TasklistPage.visit(bookingId)
    tasklistPageForSubmittedForm.checkNoPartsComplete()
  })
})
