const TasklistPage = require('../../pages/tasklistPage')

context('Submit the incident report', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
  })

  it('A form cannot be submitted until confirmed', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()

    const newIncidentPage = tasklistPage.startNewForm()
    const detailsPage = newIncidentPage.save()
    const relocationAndInjuriesPage = detailsPage.save()
    const evidencePage = relocationAndInjuriesPage.save()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.clickSubmit()

    checkAnswersPage.checkStillOnPage()
    checkAnswersPage.errorSummary().contains('There is a problem')
    checkAnswersPage.errorLink('Check that you agree before submitting').click()
    cy.focused().check()
    checkAnswersPage.submit()
  })

  it('Can defer submitting form', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()

    const newIncidentPage = tasklistPage.startNewForm()
    const detailsPage = newIncidentPage.save()
    const relocationAndInjuriesPage = detailsPage.save()
    const evidencePage = relocationAndInjuriesPage.save()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.backToTasklist().click()

    TasklistPage.verifyOnPage()
  })
})
