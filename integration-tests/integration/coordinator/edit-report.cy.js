import { offender, offender2 } from '../../mockApis/data'
import NotCompletedIncidentsPage from '../../pages/reviewer/notCompletedIncidentsPage'
import CompletedIncidentsPage from '../../pages/reviewer/completedIncidentsPage'
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
      incidentDate: moment('2019-09-10 09:57:00.000').toDate(),
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

  context('incomplete reports', () => {
    it('A coordinator can access the edit incident details page for a submitted but incomplete report', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

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

  context('complete reports', () => {
    it('A coordinator can access the edit incident details page for a complete report', () => {
      cy.task('seedReport', {
        status: ReportStatus.COMPLETE,
        submittedDate: moment().toDate(),
        incidentDate: moment('2019-01-22 09:57:00.000'),
        agencyId: offender.agencyId,
        bookingId: offender.bookingId,
        sequenceNumber: 1,
        involvedStaff: [
          {
            username: 'TEST_USER',
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
          },
        ],
      })

      const completedIncidentsPage = CompletedIncidentsPage.goTo()
      completedIncidentsPage.viewIncidentLink().click()
      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
    })
  })
})
