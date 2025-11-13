import { offender } from '../../../mockApis/data'
import NotCompletedIncidentsPage from '../../../pages/reviewer/notCompletedIncidentsPage'
import CompletedIncidentsPage from '../../../pages/reviewer/completedIncidentsPage'
import ViewIncidentPage from '../../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../../pages/coordinator/editReportPage'
import EditHistoryPage from '../../../pages/coordinator/editHistoryPage'
import EvidencePage from '../../../pages/coordinator/evidencePage'
import ReasonForChangePage from '../../../pages/coordinator/reasonForChangePage'
import { ReportStatus } from '../../../../server/config/types'

context('A use of force coordinator needs to edit evidence details', () => {
  const submittedDate = new Date()
  const incidentDate = new Date()
  const seedReport = () =>
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate,
      incidentDate,
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
        submittedDate,
        incidentDate,
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

    it('Cancelling from reason-for-change page should delete any unpersisted edit', () => {
      cy.task('seedReport', {
        status: ReportStatus.COMPLETE,
        submittedDate,
        incidentDate,
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
      // make edits
      const evidencePage = EvidencePage.verifyOnPage()
      evidencePage.baggedEvidenceNo().click()
      evidencePage.photographsTakenNo().click()
      evidencePage.cctvNo().click()
      evidencePage.continueButton().click()

      const reasonForChangePage = ReasonForChangePage.verifyOnPage()

      // click cancel button before persisting changes
      reasonForChangePage.cancelLink().click()

      viewIncidentPage.editReportButton().click()
      editReportPage.changeEvidenceLink().click()

      // inputs should revert back to persisted data, i.e without any edits that were saved to flash
      evidencePage.evidenceTag(0).should('have.value', 'Bagged evidence 1')
      evidencePage.evidenceTagDescription(0).should('have.value', 'This evidence was collected from the prisoner 1')
      evidencePage.evidenceTag(1).should('have.value', 'Bagged evidence 2')
      evidencePage.evidenceTagDescription(1).should('have.value', 'This evidence was collected from the prisoner 2')
      evidencePage.evidenceTag(2).should('have.value', 'Bagged evidence 3')
      evidencePage.evidenceTagDescription(2).should('have.value', 'Clothes samples')
      evidencePage.cctvNotKnown().should('be.checked')
      evidencePage.photographsTakenYes().should('be.checked')
    })
  })
})
