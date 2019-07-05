const TasklistPage = require('../../pages/tasklistPage')

context('Logging in', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
  })

  it('Can login and create a new incident', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)

    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.offenderName().contains('Norman Smith (A1234AC)')
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationPage = detailsPage.save()
    const evidencePage = relocationPage.save()
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
    const relocationPage = detailsPage.save()
    const evidencePage = relocationPage.save()
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
