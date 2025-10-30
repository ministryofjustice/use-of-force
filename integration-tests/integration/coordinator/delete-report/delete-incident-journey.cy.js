import moment from 'moment'
import DeleteIncidentPage from '../../../pages/coordinator/deleteIncidentPage'
import DeleteIncidentReasonPage from '../../../pages/coordinator/deleteIncidentReasonPage'
import DeleteIncidentSuccessPage from '../../../pages/coordinator/deleteIncidentSuccessPage'
import ViewIncidentPage from '../../../pages/coordinator/viewIncidentPage'

const NotCompletedIncidentsPage = require('../../../pages/reviewer/notCompletedIncidentsPage')
const { offender } = require('../../../mockApis/data')
const { ReportStatus } = require('../../../../server/config/types')

const seedReport = () => {
  cy.task('seedReport', {
    status: ReportStatus.SUBMITTED,
    submittedDate: moment().toDate(),
    username: 'TEST_USER',
    reporterName: 'James Stuart',
    incidentDate: moment('2019-09-10 09:57:40.000').toDate(),
    agencyId: 'MDI',
    bookingId: 1001,
    involvedStaff: [
      {
        username: 'TEST_USER',
        name: 'TEST_USER name',
        email: 'TEST_USER@gov.uk',
      },
    ],
  })
}

describe('Coordinator Delete Incident Journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER', 'ANOTHER_USER'])
    seedReport()
    cy.task('stubCoordinatorLogin')
    cy.login()
  })

  it('should complete the delete incident journey including all validation and success', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)
    notCompletedIncidentsPage.viewIncidentLink().click()
    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.deleteIncidentButton().click()

    // Step 1: Visit delete incident page and check elements
    const deleteIncidentPage = DeleteIncidentPage.verifyOnPage()
    deleteIncidentPage.yesRadio().should('exist')
    deleteIncidentPage.noRadio().should('exist')

    // Step 2: Try to continue without selecting confirmation (expect error)
    deleteIncidentPage.continueButton().click()
    deleteIncidentPage.errorSummary().should('contain', 'Confirm whether you want to delete this incident')

    // Step 3: Select 'no' and check redirect
    deleteIncidentPage.noRadio().check({ force: true })
    deleteIncidentPage.continueButton().click()
    cy.url().should('include', '/not-completed-incidents')
    ViewIncidentPage.verifyOnPage()

    // Step 4: restart the journey from the beginning
    notCompletedIncidentsPage.viewIncidentLink().click()
    ViewIncidentPage.verifyOnPage()
    viewIncidentPage.deleteIncidentButton().click()

    DeleteIncidentPage.verifyOnPage()
    deleteIncidentPage.yesRadio().check({ force: true })
    deleteIncidentPage.continueButton().click()

    const deleteIncidentReasonPage = DeleteIncidentReasonPage.verifyOnPage()

    // Step 5: Try to continue without selecting a reason (expect error)
    deleteIncidentReasonPage.continueButton().click()
    deleteIncidentReasonPage.errorSummary().should('contain', 'Provide a reason for deleting this report')

    // // Step 6: Select a reason, go forward, and complete journey
    deleteIncidentReasonPage.reasonRadio('not-uof-Incident').click()
    deleteIncidentReasonPage.continueButton().click()

    const deleteIncidentSuccessPage = DeleteIncidentSuccessPage.verifyOnPage()
    deleteIncidentSuccessPage.viewIncidentsLink().click()

    ViewIncidentPage.verifyOnPage()
    notCompletedIncidentsPage.getNoTodoRows().should('exist')
  })

  it('should complete the delete incident journey and allow reason text to be added', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()
    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.deleteIncidentButton().click()
    const deleteIncidentPage = DeleteIncidentPage.verifyOnPage()
    deleteIncidentPage.continueButton().click()
    deleteIncidentPage.yesRadio().check({ force: true })
    deleteIncidentPage.continueButton().click()
    const deleteIncidentReasonPage = DeleteIncidentReasonPage.verifyOnPage()

    // Try to continue without selecting a reason (expect error)
    deleteIncidentReasonPage.reasonRadio('another-reason').click()
    deleteIncidentReasonPage.continueButton().click()
    deleteIncidentReasonPage.errorSummary().should('contain', 'Specify a reason for deleting this report')

    //  now add text and complete the journey
    deleteIncidentReasonPage.anotherReasonText().type('This is another reason for deleting the report')
    deleteIncidentReasonPage.continueButton().click()

    const deleteIncidentSuccessPage = DeleteIncidentSuccessPage.verifyOnPage()
    deleteIncidentSuccessPage.viewIncidentsLink().click()

    ViewIncidentPage.verifyOnPage()
    notCompletedIncidentsPage.getNoTodoRows().should('exist')
  })
})
