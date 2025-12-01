import ViewIncidentPage from '../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../pages/coordinator/editReportPage'

const moment = require('moment')
const { offender } = require('../../mockApis/data')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const ViewReportPage = require('../../pages/reviewer/viewReportPage')
const YourReportsPage = require('../../pages/yourReports/yourReportsPage')
const YourReportPage = require('../../pages/yourReports/yourReportPage')
const ConfirmStatementDeletePage = require('../../pages/reviewer/confirmStatementDeletePage')
const CompletedIncidentsPage = require('../../pages/reviewer/completedIncidentsPage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const InvolvedStaffPage = require('../../pages/coordinator/viewInvolvedStaffPage')
const ReasonForDeletingInvolvedStaffPage = require('../../pages/coordinator/reasonForDeletingInvolvedStaffPage')

const { ReportStatus } = require('../../../server/config/types')

context('A use of force coordinator can remove involved staff', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  const seedReport = () =>
    cy.task('seedReport', {
      username: 'TEST_USER',
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      incidentDate: moment().subtract(3, 'days').toDate(),
      agencyId: 'MDI',
      bookingId: 1001,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
        {
          username: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MRS_JONES@gov.uk',
        },
      ],
    })

  it('should complete the report when the last involved staff is removed', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeStaffInvolvedLink().click()

    const involvedStaffPage = InvolvedStaffPage.verifyOnPage()
    involvedStaffPage.staffInvolvedTableRows().should('have.length', 2)
    involvedStaffPage.staffInvolvedTableRowDeleteLink('MRS_JONES').click()

    const reasonForDeletingInvolvedStaffPage = ReasonForDeletingInvolvedStaffPage.verifyOnPage()
    reasonForDeletingInvolvedStaffPage.reasonPersonNotInvolvedRadionButton().click()
    reasonForDeletingInvolvedStaffPage.additionalInfoTextInput().type('Not involved in this incident')
    reasonForDeletingInvolvedStaffPage.saveChanges().click()

    involvedStaffPage.staffInvolvedTableRows().should('have.length', 1)
    involvedStaffPage.staffInvolvedTableRows().should('not.contain', 'MRS_JONES')

    involvedStaffPage
      .successBanner()
      .should('contain.text', 'You have deleted MRS_JONES name (MRS_JONES) from the incident.')
  })

  it('should remove statements when involved staff are removed', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    // check initial state of statements table
    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.statementsTabLink().click()
    viewIncidentPage.statementsTableRows().should('have.length', 2)
    viewIncidentPage.statementsTableRows().should('contain', 'MRS_JONES')

    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeStaffInvolvedLink().click()

    const involvedStaffPage = InvolvedStaffPage.verifyOnPage()
    involvedStaffPage.staffInvolvedTableRows().should('have.length', 2)
    involvedStaffPage.staffInvolvedTableRowDeleteLink('MRS_JONES').click()

    const reasonForDeletingInvolvedStaffPage = ReasonForDeletingInvolvedStaffPage.verifyOnPage()
    reasonForDeletingInvolvedStaffPage.reasonPersonNotInvolvedRadionButton().click()
    reasonForDeletingInvolvedStaffPage.additionalInfoTextInput().type('Not involved in this incident')
    reasonForDeletingInvolvedStaffPage.saveChanges().click()

    involvedStaffPage.returnToIncidentReportLink().click()
    ViewIncidentPage.verifyOnPage()

    // check updated state of statements table
    viewIncidentPage.statementsTabLink().click()
    viewIncidentPage.statementsTableRows().should('have.length', 1)
    viewIncidentPage.statementsTableRows().should('not.contain', 'MRS_JONES')
  })

  it('should not show involved staff on the report after they have been removed', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()
  })

  it('should not show involved staff on the statements tab after they have been removed', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()
  })

  it('should show the report in the correct completed/not completed lists after involved staff have been removed', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()
  })

  it('should retain involved staff if the coordinator cancels the removal on the confirmation page', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()
  })

  it('should retain involved staff if the coordinator clicks the cancel link on the confirmation page', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()
  })

  it('should show a confirmation message when involved staff have been removed', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()
  })

  it('should show delete links for other staff but not for lthe report owner', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()

    // const viewReportPage = ViewReportPage.goTo(reportId)

    // Navigate to involved staff tab
    // viewReportPage.selectTab('staff-involved')

    // Assert delete link exists for MRS_JONES
    // cy.get(`[data-qa="delete-link-MRS_JONES"]`).should('exist')

    // Assert delete link does NOT exist for TEST_USER
    // cy.get(`[data-qa="delete-link-TEST_USER"]`).should('not.exist')
  })

  // it.only('should only allow coordinators to remove involved staff', () => {
  //   cy.task('stubCoordinatorLogin')
  //   cy.login()

  //   seedReport()

  //   const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
  //   notCompletedIncidentsPage.viewIncidentLink().click()

  //   const viewIncidentPage = ViewIncidentPage.verifyOnPage()
  //   viewIncidentPage.editReportButton().click()

  //   const editReportPage = EditReportPage.verifyOnPage()
  //   editReportPage.changeStaffInvolvedLink().click()

  //   const involvedStaffPage = InvolvedStaffPage.verifyOnPage()
  //   involvedStaffPage.staffInvolvedTableRows().should('have.length', 2)
  //   involvedStaffPage.staffInvolvedTableRowDeleteLink('MRS_JONES').click()

  //   const reasonForDeletingInvolvedStaffPage = ReasonForDeletingInvolvedStaffPage.verifyOnPage()
  //   reasonForDeletingInvolvedStaffPage.reasonPersonNotInvolvedRadionButton().click()
  //   reasonForDeletingInvolvedStaffPage.additionalInfoTextInput().type('Not involved in this incident')
  //   reasonForDeletingInvolvedStaffPage.saveChanges().click()

  //   involvedStaffPage.staffInvolvedTableRows().should('have.length', 1)
  //   involvedStaffPage.staffInvolvedTableRows().should('not.contain', 'MRS_JONES')

  //   involvedStaffPage
  //     .successBanner()
  //     .should('contain.text', 'You have deleted MRS_JONES name (MRS_JONES) from the incident.')
  // })
})
