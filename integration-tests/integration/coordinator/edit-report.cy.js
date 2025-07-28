import { offender } from '../../mockApis/data'
import NotCompletedIncidentsPage from '../../pages/reviewer/notCompletedIncidentsPage'
import ViewIncidentPage from '../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../pages/coordinator/editReportPage'
import IncidentDetailsPage from '../../pages/coordinator/incidentDetailsPage'
import PrisonPage from '../../pages/coordinator/prisonPage'
import { ReportStatus } from '../../../server/config/types'

const moment = require('moment')

context('A use of force coordinator needs to edit reports', () => {
  const seedReport = () =>
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
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

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrisons')
    cy.task('stubOffenders', [offender])
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.task('stubCoordinatorLogin')
    cy.login()
    seedReport()
  })

  // need to to completed report and own reports, just at top level

  it('A coordinator can access the edit incident details page for a submitted but incomplete report', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    const { reportId } = notCompletedIncidentsPage.getTodoRow(0)
    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeIncidentDetailsLink().click()
  })

  it('A coordinator can cancel out of the edit incident details page and return to edit report page', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeIncidentDetailsLink().click()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    incidentDetailsPage.cancelLink().click()
    EditReportPage.verifyOnPage()
  })

  it('A coordinator can change prison where incident occured', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeIncidentDetailsLink().click()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    incidentDetailsPage.changePrisonLink().click()

    cy.task('stubPrison', 'LEI')
    const prisonPage = PrisonPage.verifyOnPage()
    prisonPage.selectPrison().select('HMP Leeds')
    prisonPage.continueButton().click()

    IncidentDetailsPage.verifyOnPage()
    cy.url().should('include', '?new-prison=LEI')
    incidentDetailsPage.prisonName().should('contain', 'Leeds')
    incidentDetailsPage.whereInPrisonLabelText().should('contain', 'Leeds')
  })

  it('Will navigate to the Reason for changing the incident details page', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeIncidentDetailsLink().click()

    const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.continueButton().click()
  })
})
