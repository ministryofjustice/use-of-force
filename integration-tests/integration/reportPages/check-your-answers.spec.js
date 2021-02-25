const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const CheckAnswersPage = require('../../pages/createReport/checkAnswersPage')

const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')
const RelocationAndInjuriesPage = require('../../pages/createReport/relocationAndInjuriesPage')
const EvidencePage = require('../../pages/createReport/evidencePage')
const StaffInvolvedPage = require('../../pages/createReport/staffInvolvedPage')

const { ReportStatus } = require('../../../server/config/types')

context('Check your answers page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrisons')
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })
    cy.login()
  })

  it('Can edit answers from check your answers page ', () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
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
      finalValue: 'No - relocated to vehicle',
    })

    canEditEvidencePage({
      checkAnswersPage,
      initialValue: 'Yes',
      operation: page => page.clickSave(),
      finalValue: 'No',
    })
  })

  it('Can edit involved staff from check your answers page ', () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()
    checkAnswersPage.editStaffInvolvedLink().click()
    const staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.saveButton().should('exist')
    staffInvolvedPage.cancelButton().should('exist')
  })

  it('Can cancel editing answers from check your answers page ', () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
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
    relocationAndInjuriesPage.relocationType().check('VEHICLE')
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
})
