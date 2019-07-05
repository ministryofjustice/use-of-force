const TasklistPage = require('../../pages/tasklistPage')

context('Logging in', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
  })

  it('A form cannot be submitted until confirmed', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()

    const newIncidentPage = tasklistPage.startNewForm()
    const detailsPage = newIncidentPage.save()
    const relocationPage = detailsPage.save()
    const evidencePage = relocationPage.save()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.clickSubmit()

    checkAnswersPage.checkStillOnPage()
    checkAnswersPage.errorSummary().contains('There is a problem')
    checkAnswersPage.confirm()
    checkAnswersPage.submit()
  })
})
