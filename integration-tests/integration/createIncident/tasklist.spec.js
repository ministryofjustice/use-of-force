const TasklistPage = require('../../pages/tasklistPage')

context('tasklist', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'Test User')
    cy.task('stubUserDetailsRetrieval', 'Mr Zagato')
    cy.task('stubUserDetailsRetrieval', 'Mrs Jones')
  })

  it('Offender details are rendered correctly', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()
    tasklistPage.offenderName().contains('Norman Smith')
    tasklistPage.dob().contains('26 December 2000')
    tasklistPage.nomisId().contains('A1234AC')
    tasklistPage.offenderImage().should('be.visible')
  })

  it('Parts are marked as complete after filled in', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationPage = detailsPage.save()
    relocationPage.fillForm()
    const evidencePage = relocationPage.save()
    evidencePage.fillForm()
    evidencePage.save()

    const tasklistPageAfterAllPartsComplete = TasklistPage.visit(bookingId)
    tasklistPageAfterAllPartsComplete.checkAllPartsComplete()
  })
})
