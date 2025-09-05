import { offender } from '../../../mockApis/data'
import NotCompletedIncidentsPage from '../../../pages/reviewer/notCompletedIncidentsPage'
import CompletedIncidentsPage from '../../../pages/reviewer/completedIncidentsPage'
import ViewIncidentPage from '../../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../../pages/coordinator/editReportPage'
import EditHistoryPage from '../../../pages/coordinator/editHistoryPage'
import RelocationAndInjuriesPage from '../../../pages/coordinator/relocationAndInjuriesPage'
import PrisonPage from '../../../pages/coordinator/prisonPage'
import ReasonForChangePage from '../../../pages/coordinator/reasonForChangePage'
import { ReportStatus } from '../../../../server/config/types'

const moment = require('moment')

context('A use of force coordinator needs to edit relocation and injuries', () => {
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
    it('A coordinator can edit the relocation and injuries page', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

      notCompletedIncidentsPage.viewIncidentLink().click()

      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
      editReportPage.changeRelocationAndInjuriesLink().click()

      const relocationAndInjuriesPage = RelocationAndInjuriesPage.verifyOnPage()
      relocationAndInjuriesPage.prisonerRelocation().select('OWN_CELL')
      relocationAndInjuriesPage.prisonerHospitalisationNo().click()
      relocationAndInjuriesPage.continueButton().click()
    })
  })

  context('complete reports', () => {
    it.only('A coordinator can edit the relocation and injuries page', () => {
      cy.task('seedReport', {
        status: ReportStatus.COMPLETE,
        submittedDate: moment('2025-07-23 09:57:00.000'),
        incidentDate: moment('2025-07-22 09:57:00.000'),
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
      editReportPage.changeRelocationAndInjuriesLink().click()

      const relocationAndInjuriesPage = RelocationAndInjuriesPage.verifyOnPage()
      relocationAndInjuriesPage.prisonerRelocation().select('OWN_CELL')
      relocationAndInjuriesPage.prisonerHospitalisationNo().click()
      relocationAndInjuriesPage.continueButton().click()

      const reasonForChangePage = ReasonForChangePage.verifyOnPage()
      reasonForChangePage.backLink().should('exist')
      reasonForChangePage.prisonerProfile().should('exist')

      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'Where was the prisoner relocated to')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Segregation unit')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'Own cell')

      reasonForChangePage
        .tableRowAndColHeading(2, 'question')
        .should('contain', 'Did the prisoner need outside hospitalisation at the time')
      reasonForChangePage.tableRowAndColHeading(2, 'old-value').should('contain', 'Yes')
      reasonForChangePage.tableRowAndColHeading(2, 'new-value').should('contain', 'No')

      reasonForChangePage.backLink().click()
      relocationAndInjuriesPage.continueButton().click()

      //  ensure returning to previous page retains previous selections
      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'Where was the prisoner relocated to')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Segregation unit')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'Own cell')

      reasonForChangePage
        .tableRowAndColHeading(2, 'question')
        .should('contain', 'Did the prisoner need outside hospitalisation at the time')
      reasonForChangePage.tableRowAndColHeading(2, 'old-value').should('contain', 'Yes')
      reasonForChangePage.tableRowAndColHeading(2, 'new-value').should('contain', 'No')
      reasonForChangePage.radioAnotherReason().click()
      reasonForChangePage.anotherReasonText().type('Some more details')
      reasonForChangePage.additionalInfoText().type('Some even more additional details')
      reasonForChangePage.saveButton().click()

      ViewIncidentPage.verifyOnPage()
      viewIncidentPage.successBanner().should('exist')
      viewIncidentPage.editHistoryLinkInSuccessBanner().click()

      const editHistoryPage = EditHistoryPage.verifyOnPage()
      editHistoryPage.tableRowAndColHeading(1, 'what-changed').should('contain', 'Where was the prisoner relocated to')
      editHistoryPage.tableRowAndColHeading(1, 'changed-from').should('contain', 'Segregation unit')
      editHistoryPage.tableRowAndColHeading(1, 'changed-to').should('contain', 'Own cell')
      editHistoryPage.tableRowAndColHeading(1, 'reason').should('contain', 'Another reason: Some more details')
      editHistoryPage.summaryTextLink(3).click()
      editHistoryPage.tableRowAndSummaryText(3).should('contain', 'Some even more additional details')
    })
  })
})
