import { offender } from '../../../mockApis/data'
import NotCompletedIncidentsPage from '../../../pages/reviewer/notCompletedIncidentsPage'
import CompletedIncidentsPage from '../../../pages/reviewer/completedIncidentsPage'
import ViewIncidentPage from '../../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../../pages/coordinator/editReportPage'
import EditHistoryPage from '../../../pages/coordinator/editHistoryPage'
import EvidencePage from '../../../pages/coordinator/evidencePage'
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
    it('A coordinator can edit the evidence page', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

      notCompletedIncidentsPage.viewIncidentLink().click()

      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
      editReportPage.changeEvidenceLink().click()

      const evidencePage = EvidencePage.verifyOnPage()
      evidencePage.baggedEvidenceNo().click()
      evidencePage.photographsTakenNo().click()
      evidencePage.cctvNo().click()
      evidencePage.continueButton().click()
    })
  })

  context('complete reports', () => {
    it('A coordinator can edit the evidence page', () => {
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
      editReportPage.changeEvidenceLink().click()

      const evidencePage = EvidencePage.verifyOnPage()
      evidencePage.baggedEvidenceNo().click()
      evidencePage.photographsTakenNo().click()
      evidencePage.cctvNo().click()
      evidencePage.continueButton().click()

      const reasonForChangePage = ReasonForChangePage.verifyOnPage()
      reasonForChangePage.backLink().should('exist')
      reasonForChangePage.prisonerProfile().should('exist')

      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'Was any evidence bagged and tagged?')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Yes')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'No')

      reasonForChangePage.tableRowAndColHeading(2, 'question').should('contain', 'Evidence tag and desciption')
      reasonForChangePage
        .tableRowAndColHeading(2, 'old-value')
        .should(
          'contain',
          'Bagged evidence 1- This evidence was collected from the prisoner 1, Bagged evidence 2- This evidence was collected from the prisoner 2, Bagged evidence 3- Clothes samples'
        )
      reasonForChangePage.tableRowAndColHeading(2, 'new-value').should('contain', 'Not applicable')

      reasonForChangePage.tableRowAndColHeading(3, 'question').should('contain', 'Were any photographs taken?')
      reasonForChangePage.tableRowAndColHeading(3, 'old-value').should('contain', 'Yes')
      reasonForChangePage.tableRowAndColHeading(3, 'new-value').should('contain', 'No')

      reasonForChangePage
        .tableRowAndColHeading(4, 'question')
        .should('contain', 'Was any part of the incident captured on CCTV?')
      reasonForChangePage.tableRowAndColHeading(4, 'old-value').should('contain', 'Not known')
      reasonForChangePage.tableRowAndColHeading(4, 'new-value').should('contain', 'No')
      reasonForChangePage.backLink().click()
      evidencePage.continueButton().click()

      // ensure returning to previous page retains previous selections
      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'Was any evidence bagged and tagged?')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Yes')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'No')

      reasonForChangePage.tableRowAndColHeading(2, 'question').should('contain', 'Evidence tag and desciption')
      reasonForChangePage
        .tableRowAndColHeading(2, 'old-value')
        .should(
          'contain',
          'Bagged evidence 1- This evidence was collected from the prisoner 1, Bagged evidence 2- This evidence was collected from the prisoner 2, Bagged evidence 3- Clothes samples'
        )
      reasonForChangePage.tableRowAndColHeading(2, 'new-value').should('contain', 'Not applicable')

      reasonForChangePage.tableRowAndColHeading(3, 'question').should('contain', 'Were any photographs taken?')
      reasonForChangePage.tableRowAndColHeading(3, 'old-value').should('contain', 'Yes')
      reasonForChangePage.tableRowAndColHeading(3, 'new-value').should('contain', 'No')

      reasonForChangePage
        .tableRowAndColHeading(4, 'question')
        .should('contain', 'Was any part of the incident captured on CCTV?')
      reasonForChangePage.tableRowAndColHeading(4, 'old-value').should('contain', 'Not known')
      reasonForChangePage.tableRowAndColHeading(4, 'new-value').should('contain', 'No')
      reasonForChangePage.radioAnotherReason().click()
      reasonForChangePage.anotherReasonText().type('Some more details')
      reasonForChangePage.additionalInfoText().type('Some even more additional details')
      reasonForChangePage.saveButton().click()

      ViewIncidentPage.verifyOnPage()
      viewIncidentPage.successBanner().should('exist')
      viewIncidentPage.editHistoryLinkInSuccessBanner().click()

      const editHistoryPage = EditHistoryPage.verifyOnPage()
      editHistoryPage.tableRowAndColHeading(1, 'what-changed').should('contain', 'Was any evidence bagged and tagged?')
      editHistoryPage.tableRowAndColHeading(1, 'old-value').should('contain', 'Yes')
      editHistoryPage.tableRowAndColHeading(1, 'new-value').should('contain', 'No')
      editHistoryPage.tableRowAndColHeading(1, 'reason').should('contain', 'Another reason: Some more details')

      editHistoryPage.tableRowAndColHeading(2, 'what-changed').should('contain', 'Evidence tag and desciption')
      editHistoryPage
        .tableRowAndColHeading(2, 'old-value')
        .should(
          'contain',
          'Bagged evidence 1- This evidence was collected from the prisoner 1, Bagged evidence 2- This evidence was collected from the prisoner 2, Bagged evidence 3- Clothes samples'
        )
      editHistoryPage.tableRowAndColHeading(2, 'new-value').should('contain', 'Not applicable')

      editHistoryPage.tableRowAndColHeading(3, 'what-changed').should('contain', 'Were any photographs taken?')
      editHistoryPage.tableRowAndColHeading(3, 'old-value').should('contain', 'Yes')
      editHistoryPage.tableRowAndColHeading(3, 'new-value').should('contain', 'No')

      editHistoryPage
        .tableRowAndColHeading(4, 'what-changed')
        .should('contain', 'Was any part of the incident captured on CCTV?')
      editHistoryPage.tableRowAndColHeading(4, 'old-value').should('contain', 'Not known')
      editHistoryPage.tableRowAndColHeading(4, 'new-value').should('contain', 'No')

      editHistoryPage.summaryTextLink(5).click()
      editHistoryPage.tableRowAndSummaryText(5).should('contain', 'Some even more additional details')
    })
  })
})
