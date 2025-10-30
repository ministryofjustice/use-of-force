import { parseISO, format } from 'date-fns'
import { offender } from '../../../mockApis/data'
import NotCompletedIncidentsPage from '../../../pages/reviewer/notCompletedIncidentsPage'
import CompletedIncidentsPage from '../../../pages/reviewer/completedIncidentsPage'
import ViewIncidentPage from '../../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../../pages/coordinator/editReportPage'
import EditHistoryPage from '../../../pages/coordinator/editHistoryPage'
import IncidentDetailsPage from '../../../pages/coordinator/incidentDetailsPage'
import PrisonPage from '../../../pages/coordinator/prisonPage'
import ReasonForChangePage from '../../../pages/coordinator/reasonForChangePage'
import { ReportStatus } from '../../../../server/config/types'

context('A use of force coordinator needs to edit incident-details', () => {
  const seedReport = () =>
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: new Date(),
      incidentDate: parseISO('2019-09-10T09:57:00.000Z'),
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
      IncidentDetailsPage.verifyOnPage()
    })

    it('A coordinator can cancel out of the edit incident details page and return to incident details page', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.viewIncidentLink().click()

      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
      editReportPage.changeIncidentDetailsLink().click()

      const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.cancelLink().click()
      ViewIncidentPage.verifyOnPage()
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

    it('The coordinator can view their edits both prior and after completing the process', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.viewIncidentLink().click()

      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
      editReportPage.changeIncidentDetailsLink().click()

      const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.plannedUseOfForceRadioNo().click()
      incidentDetailsPage.continueButton().click()

      const reasonForChangePage = ReasonForChangePage.verifyOnPage()
      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'Was use of force planned')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Yes')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'No')
      reasonForChangePage.tableRowAndColHeading(2, 'new-value').should('contain', 'Not applicable')

      reasonForChangePage.errorInReportRadio().click()
      reasonForChangePage.additionalInfoText().type('Some additional info text')
      reasonForChangePage.saveButton().click()

      ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editHistoryLinkInSuccessBanner().click()

      const editHistoryPage = EditHistoryPage.verifyOnPage()
      editHistoryPage.tableRowAndColHeading(2, 'new-value').should('contain', 'Not applicable')
    })

    it('A coordinator can edit another report without completing current edit without the risk of data cross-contamination', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.viewIncidentLink().click()

      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
      editReportPage.changeIncidentDetailsLink().click()

      const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.authorisedByTextInput().type('-Smith') // edit changes the name
      incidentDetailsPage.continueButton().click()

      const reasonForChangePage = ReasonForChangePage.verifyOnPage()
      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'Who authorised use of force')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Eric Bloodaxe')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'Eric Bloodaxe-Smith')

      cy.task('seedReport', {
        sequenceNumber: 1,
        reporterName: 'Tom Jones',
        incidentDate: parseISO('2024-01-25T09:57:40.000Z'),
        submittedDate: parseISO('2024-01-29T10:30:43.122Z'),
        status: ReportStatus.SUBMITTED,
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

      NotCompletedIncidentsPage.goTo()
      cy.get(':nth-child(2) > :nth-child(5) > [data-qa="view-incident-link"]').click()
      viewIncidentPage.editReportButton().click()

      EditReportPage.verifyOnPage()
      editReportPage.changeIncidentDetailsLink().click()

      IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.authorisedByTextInput().should('have.value', 'Eric Bloodaxe')
      incidentDetailsPage.authorisedByTextInput().should('not.have.value', 'Eric Bloodaxe-Smith')

      incidentDetailsPage.continueButton().click()
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('not.contain', 'Eric Bloodaxe')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('not.contain', 'Eric Bloodaxe-Smith')
    })

    it('A coordinator can see their edits when using back link in the /reason-for-change page', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.viewIncidentLink().click()

      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
      editReportPage.changeIncidentDetailsLink().click()

      const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.authorisedByTextInput().type('-Smith') // edit changes the name
      incidentDetailsPage.continueButton().click()

      const reasonForChangePage = ReasonForChangePage.verifyOnPage()
      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'Who authorised use of force')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Eric Bloodaxe')
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'Eric Bloodaxe-Smith')

      reasonForChangePage.backLink().click()

      IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.authorisedByTextInput().should('not.have.value', 'Eric Bloodaxe')
      incidentDetailsPage.authorisedByTextInput().should('have.value', 'Eric Bloodaxe-Smith')
    })

    it('A coordinator will be prevented from completing the proess if there are no changes', () => {
      const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
      notCompletedIncidentsPage.viewIncidentLink().click()

      const viewIncidentPage = ViewIncidentPage.verifyOnPage()
      viewIncidentPage.editReportButton().click()

      const editReportPage = EditReportPage.verifyOnPage()
      editReportPage.changeIncidentDetailsLink().click()

      const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      incidentDetailsPage.continueButton().click()
      incidentDetailsPage
        .errorSummary()
        .should('contain', "You must change something or select 'Cancel' to return to the use of force incident page")
      incidentDetailsPage.errorMessage().should('contain', 'Cancel to return to the use of force incident page')
    })
  })

  context('complete reports', () => {
    it('A coordinator can edit the incident details and eventually view the edit history', () => {
      cy.task('seedReport', {
        status: ReportStatus.COMPLETE,
        submittedDate: parseISO('2025-07-23T09:57:00.000Z'),
        incidentDate: parseISO('2025-07-22T09:57:00.000Z'),
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
      editReportPage.changeIncidentDetailsLink().click()
      const incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
      // Change both date and time
      incidentDetailsPage.hourOfIncident().click().clear().type('10')
      incidentDetailsPage.minuteOfIncident().click().clear().type('40')
      incidentDetailsPage.dateOfIncident().clear().type('07/10/2025')
      incidentDetailsPage.continueButton().click()

      const reasonForChangePage = ReasonForChangePage.verifyOnPage()
      reasonForChangePage.backLink().should('exist')
      reasonForChangePage.prisonerProfile().should('exist')
      reasonForChangePage.tableRowAndColHeading(1, 'question').should('contain', 'When did the incident happen?')
      // Dynamically assert on local time display to match the app using only date-fns
      const oldDateObj = parseISO('2025-07-22T09:57:00.000Z')
      const newDateObj = parseISO('2025-10-07T09:40:00.000Z')
      const oldDate = format(oldDateObj, 'dd/MM/yyyy HH:mm')
      const newDate = format(newDateObj, 'dd/MM/yyyy HH:mm')
      reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', oldDate)
      reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', newDate)
      reasonForChangePage.radioAnotherReason().click()
      reasonForChangePage.anotherReasonText().type('Some more details')
      reasonForChangePage.additionalInfoText().type('Some even more additional details')
      reasonForChangePage.saveButton().click()

      ViewIncidentPage.verifyOnPage()
      viewIncidentPage.successBanner().should('exist')
      viewIncidentPage.editHistoryLinkInSuccessBanner().click()
      const editHistoryPage = EditHistoryPage.verifyOnPage()
      editHistoryPage.tableRowAndColHeading(1, 'what-changed').should('contain', 'When did the incident happen?')
      editHistoryPage.tableRowAndColHeading(1, 'old-value').should('contain', oldDate)
      editHistoryPage.tableRowAndColHeading(1, 'new-value').should('contain', newDate)
      editHistoryPage.tableRowAndColHeading(1, 'reason').should('contain', 'Another reason: Some more details')
      editHistoryPage.summaryTextLink(2).click()
      editHistoryPage.tableRowAndSummaryText(2).should('contain', 'Some even more additional details')
    })
  })
})
