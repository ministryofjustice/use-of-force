import ViewIncidentPage from '../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../pages/coordinator/editReportPage'

const moment = require('moment')
const { offender } = require('../../mockApis/data')
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

    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()
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

  const navigateToInvolvedStaffPage = () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeStaffInvolvedLink().click()

    return InvolvedStaffPage.verifyOnPage()
  }

  it('should remove the selected staff member from the staff involved table and display a success banner when they are successfully removed from the report', () => {
    const involvedStaffPage = navigateToInvolvedStaffPage()
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

  it('should add a new row in the edit history tab when involved staff are removed', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    // check initial state of statements table
    const viewIncidentPage = ViewIncidentPage.verifyOnPage()

    viewIncidentPage.editHistoryTabLink().should('not.exist')

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

    // check edit history table
    viewIncidentPage.editHistoryTabLink().click()
    viewIncidentPage.editHistoryTable().should('be.visible')
    viewIncidentPage.editHistoryTable().should('have.length', 1)
    viewIncidentPage
      .editHistoryTableOldValue()
      .should('contain', 'TEST_USER name (TEST_USER), MRS_JONES name (MRS_JONES)')
    viewIncidentPage.editHistoryTableNewValue().should('contain', 'TEST_USER name (TEST_USER)')
    viewIncidentPage
      .editHistoryTablReason()
      .should('contain', 'Bodycam or CCTV footage revealed the person was not involved')
    viewIncidentPage.editHistoryTableAdditionalComments().should('contain', 'Not involved in this incident')
  })

  it('should retain involved staff if the coordinator cancels the removal on the confirmation page by clicking the back link', () => {
    const involvedStaffPage = navigateToInvolvedStaffPage()
    involvedStaffPage.staffInvolvedTableRows().should('have.length', 2)
    involvedStaffPage.staffInvolvedTableRowDeleteLink('MRS_JONES').click()

    const reasonForDeletingInvolvedStaffPage = ReasonForDeletingInvolvedStaffPage.verifyOnPage()
    reasonForDeletingInvolvedStaffPage.backLink().click()

    InvolvedStaffPage.verifyOnPage()
    involvedStaffPage.staffInvolvedTableRows().should('have.length', 2)
    involvedStaffPage.staffInvolvedTableRows().should('contain', 'MRS_JONES')
  })

  it('should retain involved staff if the coordinator cancels the removal on the confirmation page by clicking the cancel link', () => {
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
    reasonForDeletingInvolvedStaffPage.cancelLink().click()

    ViewIncidentPage.verifyOnPage()
    viewIncidentPage.staffInvolvedTableRows().should('have.length', 2)
    viewIncidentPage.staffInvolvedTableRows().should('contain', 'TEST_USER')
    viewIncidentPage.staffInvolvedTableRows().should('contain', 'MRS_JONES')
  })

  it('should show delete links for other staff but not for the report owner', () => {
    const involvedStaffPage = navigateToInvolvedStaffPage()
    involvedStaffPage.staffInvolvedTableRows().eq(0).should('contain.text', 'TEST_USER')
    involvedStaffPage.staffInvolvedTableRows().eq(0).should('not.contain', 'Delete')
    involvedStaffPage.staffInvolvedTableRows().eq(1).should('contain', 'Delete')
  })

  it('should display validation errors in the reason for deleteing view', () => {
    const involvedStaffPage = navigateToInvolvedStaffPage()
    involvedStaffPage.staffInvolvedTableRows().should('have.length', 2)
    involvedStaffPage.staffInvolvedTableRowDeleteLink('MRS_JONES').click()

    const reasonForDeletingInvolvedStaffPage = ReasonForDeletingInvolvedStaffPage.verifyOnPage()

    // do not select reason or provide additional info
    reasonForDeletingInvolvedStaffPage.saveChanges().click()
    reasonForDeletingInvolvedStaffPage.errorSummary().should('be.visible')
    reasonForDeletingInvolvedStaffPage.errorSummary().should('contain.text', 'There is a problem')
    reasonForDeletingInvolvedStaffPage
      .errorSummary()
      .should('contain.text', 'Provide a reason for deleting this person')
    reasonForDeletingInvolvedStaffPage
      .errorSummary()
      .should('contain.text', 'Provide additional information to explain why you are deleting this person')
    reasonForDeletingInvolvedStaffPage.reasonError().should('contain.text', 'Provide a reason for deleting this person')
    reasonForDeletingInvolvedStaffPage.reasonAdditionalInfoError().should('be.visible')
    reasonForDeletingInvolvedStaffPage
      .reasonAdditionalInfoError()
      .should('contain.text', 'Provide additional information to explain why you are deleting this person')

    // select reason but do not provide additional info
    reasonForDeletingInvolvedStaffPage.reasonAnotherReasonRadionButton().click()
    reasonForDeletingInvolvedStaffPage.saveChanges().click()
    reasonForDeletingInvolvedStaffPage.errorSummary().should('be.visible')
    reasonForDeletingInvolvedStaffPage
      .errorSummary()
      .should('contain.text', 'Specify the reason for deleting this person')
    reasonForDeletingInvolvedStaffPage.anotherReasonError().should('be.visible')
    reasonForDeletingInvolvedStaffPage
      .anotherReasonError()
      .should('contain.text', 'Specify the reason for deleting this person')

    // proivide additional info that is more than 500 characters long
    const longAdditionalInfo = 'a'.repeat(501)
    reasonForDeletingInvolvedStaffPage.additionalInfoTextInput().clear().type(longAdditionalInfo)
    reasonForDeletingInvolvedStaffPage.saveChanges().click()
    reasonForDeletingInvolvedStaffPage.errorSummary().should('be.visible')
    reasonForDeletingInvolvedStaffPage
      .errorSummary()
      .should('contain.text', 'Additional information must be 500 characters or fewer')
    reasonForDeletingInvolvedStaffPage.reasonAdditionalInfoError().should('be.visible')
    reasonForDeletingInvolvedStaffPage
      .reasonAdditionalInfoError()
      .should('contain.text', 'Additional information must be 500 characters or fewer')

    // provide reason that is less than 3 characters long
    reasonForDeletingInvolvedStaffPage.reasonAnotherReasonInput().clear().type('ab')
    reasonForDeletingInvolvedStaffPage.additionalInfoTextInput().type('Some additional info')
    reasonForDeletingInvolvedStaffPage.saveChanges().click()
    reasonForDeletingInvolvedStaffPage.errorSummary().should('be.visible')
    reasonForDeletingInvolvedStaffPage.errorSummary().should('contain.text', 'Reason must be at least 3 characters')
    reasonForDeletingInvolvedStaffPage.anotherReasonError().should('be.visible')
    reasonForDeletingInvolvedStaffPage
      .anotherReasonError()
      .should('contain.text', 'Reason must be at least 3 characters')

    // provide reason that is more than 250 characters long
    const longReason = 'a'.repeat(251)
    reasonForDeletingInvolvedStaffPage.reasonAnotherReasonInput().clear().type(longReason)
    reasonForDeletingInvolvedStaffPage.saveChanges().click()
    reasonForDeletingInvolvedStaffPage.errorSummary().should('be.visible')
    reasonForDeletingInvolvedStaffPage.errorSummary().should('contain.text', 'Reason must be 250 characters or fewer')
    reasonForDeletingInvolvedStaffPage.anotherReasonError().should('be.visible')
    reasonForDeletingInvolvedStaffPage
      .anotherReasonError()
      .should('contain.text', 'Reason must be 250 characters or fewer')
  })

  it('should return to the edit report page when the back link is clicked in the staff involved view', () => {
    const involvedStaffPage = navigateToInvolvedStaffPage()
    involvedStaffPage.backLink().click()

    EditReportPage.verifyOnPage()
  })

  it('should return to the view incident page when the Return to incident report link is clicked in the staff involved view', () => {
    const involvedStaffPage = navigateToInvolvedStaffPage()
    involvedStaffPage.returnToIncidentReportLink().click()

    ViewIncidentPage.verifyOnPage()
  })
})
