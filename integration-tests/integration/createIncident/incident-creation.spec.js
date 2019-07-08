const TasklistPage = require('../../pages/tasklistPage')

context('Logging in', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
  })

  it('Can login and create a new incident', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)

    const newIncidentPage = tasklistPage.startNewForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationAndInjuriesPage = detailsPage.save()
    relocationAndInjuriesPage.fillForm()
    const evidencePage = relocationAndInjuriesPage.save()
    const checkAnswersPage = evidencePage.save()
    checkAnswersPage.confirm()
    checkAnswersPage.submit()
  })

  it('Form parts are saved as the user goes through the form and a new form is presented after submission', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()
    const newIncidentPage = tasklistPage.startNewForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationAndInjuriesPage = detailsPage.save()
    relocationAndInjuriesPage.fillForm()
    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.save()

    const tasklistPageAfterAllPartsComplete = TasklistPage.visit(bookingId)
    tasklistPageAfterAllPartsComplete.checkAllPartsComplete()

    const checkAnswersPage = tasklistPageAfterAllPartsComplete.goToAnswerPage()
    checkAnswersPage.confirm()
    checkAnswersPage.submit()

    const tasklistPageForSubmittedForm = TasklistPage.visit(bookingId)
    tasklistPageForSubmittedForm.checkNoPartsComplete()
  })
})
