const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const ChangePrisonPage = require('../../pages/createReport/changePrisonPage')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubPrison', 'MDI')
    cy.task('stubPrisons', 'MDI')
    cy.task('stubLocations', 'LEI')
    cy.task('stubPrison', 'LEI')
  })

  const fillFormAndSave = () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.offenderName().contains('Norman Smith')
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('true')
    const detailsPage = incidentDetailsPage.save()
    return detailsPage
  }

  const completeIncidentDetails = () => {
    cy.login(bookingId)
    fillFormAndSave()
    cy.go('back')
  }

  it('Can edit prison', () => {
    completeIncidentDetails()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.changePrison().click()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.fillForm()

    changePrisonPage.clickSave()

    incidentDetailsPage.prison().contains('Leeds')
  })

  it('Cancelling will not edit prison', () => {
    completeIncidentDetails()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.changePrison().click()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.fillForm()

    changePrisonPage.clickCancel()

    incidentDetailsPage.prison().contains('Moorland')
  })
})
