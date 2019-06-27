const newIncidentPage = require('../../pages/newIncidentPage')

context('Logging in', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
  })

  it('Can login and create a new incident', () => {
    cy.login(bookingId)

    newIncidentPage.visit(bookingId)
    newIncidentPage.offenderName().contains('Norman Smith (A1234AC)')
    const detailsPage = newIncidentPage.next()
    const relocationPage = detailsPage.next()
    const evidencePage = relocationPage.next()
    const checkAnswersPage = evidencePage.next()
    checkAnswersPage.submit()
  })
})
