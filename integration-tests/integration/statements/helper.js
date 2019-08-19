const TasklistPage = require('../../pages/tasklistPage')

const bookingId = 1001

module.exports = {
  stubExternalApis() {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'Test User')
  },

  createReport() {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()

    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage
      .staffInvolved(0)
      .name()
      .type('Test User')

    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationAndInjuriesPage = detailsPage.save()
    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.fillForm()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.confirm()
    checkAnswersPage.clickSubmit()
  },
}
