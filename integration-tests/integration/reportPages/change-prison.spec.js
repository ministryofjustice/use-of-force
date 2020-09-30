const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const ChangePrisonPage = require('../../pages/createReport/changePrisonPage')
const CheckAnswersPage = require('../../pages/createReport/checkAnswersPage')
const { ReportStatus } = require('../../../server/config/types')

context('Submitting details page form', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocation', '357591')
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubLocations', 'LEI')
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrison', 'LEI')
    cy.task('stubPrisons')
    cy.task('stubOffenders', [offender])
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.task('seedReport', { status: ReportStatus.IN_PROGRESS })
  })

  const completeIncidentDetails = () => {
    cy.login()
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.offenderName().contains('Norman Smith')
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('true')
    incidentDetailsPage.clickSave()
    cy.go('back')
  }

  it('Can edit prison prior to reaching check-your-answers page', () => {
    completeIncidentDetails()

    let incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.clickChangePrison()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.prison().select('LEI')

    changePrisonPage.clickSave()

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.prison().contains('Leeds')

    incidentDetailsPage.location().select('Asso A Wing')

    incidentDetailsPage.clickSaveAndContinue()

    const checkAnswersPage = CheckAnswersPage.verifyOnPage()

    checkAnswersPage.prison().contains('Leeds')
  })

  it('Can navigate from check-your-answers to incident-details and change prison', () => {
    completeIncidentDetails()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)

    let checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    checkAnswersPage.editIncidentDetailsLink().click()

    let incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.prison().contains('Moorland')

    incidentDetailsPage.clickChangePrison()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.prison().select('LEI')

    changePrisonPage.clickSave()

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.prison().contains('Leeds')

    incidentDetailsPage.location().select('Asso A Wing')

    incidentDetailsPage.cancelButton().should('not.exist')

    incidentDetailsPage.clickSaveAndContinue()

    checkAnswersPage = CheckAnswersPage.verifyOnPage()

    checkAnswersPage.prison().contains('Leeds')
  })

  it('Cancelling will not edit prison', () => {
    completeIncidentDetails()

    let incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.prison().contains('Moorland')

    incidentDetailsPage.clickChangePrison()

    const changePrisonPage = ChangePrisonPage.verifyOnPage()

    changePrisonPage.prison().select('LEI')

    changePrisonPage.clickCancel()

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.prison().contains('Moorland')
  })
})
