const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const ChangePrisonPage = require('../../pages/createReport/changePrisonPage')
const CheckAnswersPage = require('../../pages/createReport/checkAnswersPage')
const { ReportStatus } = require('../../../server/config/types')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocation', '357591')
    cy.task('stubLocations', 'MDI')
    cy.task('stubLocations', 'LEI')
    cy.task('stubPrison', 'MDI')
    cy.task('stubPrison', 'LEI')
    cy.task('stubPrisons')
    cy.task('stubOffenders')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
    cy.task('seedReport', { status: ReportStatus.IN_PROGRESS })
  })

  const fillFormAndSave = () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.offenderName().contains('Norman Smith')
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('true')
    incidentDetailsPage.save()
  }

  const completeIncidentDetails = () => {
    cy.login(bookingId)
    fillFormAndSave()
    cy.go('back')
  }

  it('Can edit prison prior to reaching check-your-answers page', () => {
    completeIncidentDetails()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.clickChangePrison()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.changePrisonToLeeds()

    changePrisonPage.clickSave()

    incidentDetailsPage.prison().contains('Leeds')

    incidentDetailsPage.location().select('Asso A Wing')

    incidentDetailsPage.saveAndReturn()

    const reportUseOfForcePage = ReportUseOfForcePage.verifyOnPage()

    reportUseOfForcePage.checkYourAnswersLink().click()

    const checkAnswersPage = CheckAnswersPage.verifyOnPage()

    checkAnswersPage.prison().contains('Leeds')
  })

  it('Can navigate from check-your-answers to incident-details and change prison', () => {
    cy.login(bookingId)

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)

    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    checkAnswersPage.editIncidentDetailsLink().click()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.prison().contains('Moorland')

    incidentDetailsPage.clickChangePrison()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.changePrisonToLeeds()

    changePrisonPage.clickSave()

    incidentDetailsPage.prison().contains('Leeds')

    incidentDetailsPage.location().select('Asso A Wing')

    incidentDetailsPage.cancelButton().should('not.exist')

    incidentDetailsPage.clickSave()

    checkAnswersPage.prison().contains('Leeds')
  })

  it('Cancelling will not edit prison', () => {
    completeIncidentDetails()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.prison().contains('Moorland')

    incidentDetailsPage.clickChangePrison()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.changePrisonToLeeds()

    changePrisonPage.clickCancel()

    incidentDetailsPage.prison().contains('Moorland')
  })
})
