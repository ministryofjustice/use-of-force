const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const UserDoesNotExistPage = require('../../pages/createReport/userDoesNotExistPage')
const CheckAnswersPage = require('../../pages/createReport/checkAnswersPage')

const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')
const RelocationAndInjuriesPage = require('../../pages/createReport/relocationAndInjuriesPage')
const EvidencePage = require('../../pages/createReport/evidencePage')

const { ReportStatus } = require('../../../server/config/types')

context('Check your answers page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })
  })

  it('Can edit answers from check your answers page ', () => {
    cy.task('stubLogin')
    cy.login(bookingId)

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    canEditIncidentDetailsPage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickSave(),
      finalValue: 'No',
    })

    canEditUseOfForceDetailsPage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickSave(),
      finalValue: 'No',
    })

    canEditRelocationAndInjuriesPage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickSave(),
      finalValue: 'No - relocation to vehicle',
    })

    canEditEvidencePage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickSave(),
      finalValue: 'No',
    })
  })

  it('Can cancel editing answers from check your answers page ', () => {
    cy.task('stubLogin')
    cy.login(bookingId)

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    canEditIncidentDetailsPage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickCancel(),
      finalValue: 'Yes',
    })

    canEditUseOfForceDetailsPage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickCancel(),
      finalValue: 'Yes',
    })

    canEditRelocationAndInjuriesPage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickCancel(),
      finalValue: 'Yes',
    })

    canEditEvidencePage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickCancel(),
      finalValue: 'Yes',
    })
  })

  const canEditIncidentDetailsPage = ({ checkAnswersPage, initialValue, operation, finalValue }) => {
    checkAnswersPage.useOfForcePlanned().contains(initialValue)
    checkAnswersPage.editIncidentDetailsLink().click()
    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    incidentDetailsPage.forceType.check('false')
    operation(incidentDetailsPage)
    const revisitedAnswersPage = CheckAnswersPage.verifyOnPage()
    revisitedAnswersPage.useOfForcePlanned().contains(finalValue)
  }

  const canEditUseOfForceDetailsPage = ({ checkAnswersPage, initialValue, operation, finalValue }) => {
    checkAnswersPage.positiveCommunicationUsed().contains(initialValue)
    checkAnswersPage.editUseOfForceDetailsLink().click()
    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.postiveCommunication().check('false')
    operation(useOfForceDetailsPage)
    const revisitedAnswersPage = CheckAnswersPage.verifyOnPage()
    revisitedAnswersPage.positiveCommunicationUsed().contains(finalValue)
  }

  const canEditRelocationAndInjuriesPage = ({ checkAnswersPage, initialValue, operation, finalValue }) => {
    checkAnswersPage.prisonerCompliant().contains(initialValue)
    checkAnswersPage.editRelocationAndInjuriesLink().click()
    const relocationAndInjuriesPage = RelocationAndInjuriesPage.verifyOnPage()
    relocationAndInjuriesPage.prisonerCompliant().check('false')
    relocationAndInjuriesPage.relocationType().check('relocation_to_vehicle')
    operation(relocationAndInjuriesPage)
    const revisitedAnswersPage = CheckAnswersPage.verifyOnPage()
    revisitedAnswersPage.prisonerCompliant().contains(finalValue)
  }

  const canEditEvidencePage = ({ checkAnswersPage, initialValue, operation, finalValue }) => {
    checkAnswersPage.photosTaken().contains(initialValue)
    checkAnswersPage.editEvidenceLink().click()
    const evidencePage = EvidencePage.verifyOnPage()
    evidencePage.photosTaken().check('false')
    operation(evidencePage)
    const revisitedAnswersPage = CheckAnswersPage.verifyOnPage()
    revisitedAnswersPage.photosTaken().contains(finalValue)
  }

  describe('Redirect logic around adding invalid staff to incident details whilst editting ', () => {
    it('Attempt to save invalid staff', () => {
      cy.task('stubLogin')
      cy.login(bookingId)

      const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
      const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()
      checkAnswersPage.editIncidentDetailsLink().click()
      let incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

      // attempt to enter invalid user
      incidentDetailsPage
        .staffInvolved(0)
        .name()
        .type('AAAA')
      incidentDetailsPage.clickSave()

      // prevented from leaving without addressing issue
      let userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()

      // return back to incident page, don't do anything and try again
      userDoesNotExistPage.return().click()
      incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.clickSave()

      // Still prevented from leaving with out fixing issues
      userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
      // fix issue
      userDoesNotExistPage.continue().click()

      // allowed through and correctly redirect to check-your-answers
      CheckAnswersPage.verifyOnPage()
    })

    it('Still need to resolve invalid staff, even if cancelling out half way', () => {
      cy.task('stubLogin')
      cy.login(bookingId)

      const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
      const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()
      checkAnswersPage.editIncidentDetailsLink().click()
      let incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

      // attempt to enter invalid user
      incidentDetailsPage
        .staffInvolved(0)
        .name()
        .type('AAAA')
      incidentDetailsPage.clickSave()

      // prevented from leaving without addressing issue
      let userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()

      // return back to incident page, don't do anything and try to cancel
      userDoesNotExistPage.return().click()
      incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.clickCancel()

      // Still prevented from leaving with out fixing issues
      userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()

      // fix issue
      userDoesNotExistPage.continue().click()

      // allowed through and correctly redirect to check-your-answers
      CheckAnswersPage.verifyOnPage()
    })
  })
})
