const moment = require('moment')
const { offender } = require('../../mockApis/data')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const ViewReportPage = require('../../pages/reviewer/viewReportPage')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const { ReportStatus } = require('../../../server/config/types')

context('view review page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER', 'ANOTHER_USER'])
  })

  it('A reviewer can view reports they did and did not raise', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      username: 'TEST_USER',
      reporterName: 'James Stuart',
      incidentDate: moment('2019-09-10 09:57:40.000').toDate(),
      agencyId: 'MDI',
      bookingId,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    }).then(() =>
      cy.task('seedReport', {
        status: ReportStatus.SUBMITTED,
        submittedDate: moment().toDate(),
        incidentDate: moment('2019-09-11 09:57:40.000').toDate(),
        username: 'ANOTHER_USER',
        reporterName: 'Anne OtherUser',
        agencyId: 'MDI',
        bookingId,
        involvedStaff: [
          {
            username: 'ANOTHER_USER',
            name: 'Another user name',
            email: 'TEST_USER@gov.uk',
          },
        ],
      })
    )

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 2)
    notCompletedIncidentsPage.selectedTab().contains('Not completed')

    {
      const { prisoner, reporter, viewStatementsButton } = notCompletedIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      viewStatementsButton().click()

      let viewStatementsPage = ViewStatementsPage.verifyOnPage()
      viewStatementsPage.reportLink().click()

      const viewReportPage = ViewReportPage.verifyOnPage()
      viewReportPage.reporterName().contains('James Stuart')
      viewReportPage.verifyInputs({ involvedStaff: ['Test_user Name (TEST_USER)'] })
      viewReportPage.getReportId().then(reportId => {
        viewReportPage.incidentNumber().contains(reportId)
      })

      viewReportPage.returnToIncidentOverview().click()
      viewStatementsPage = ViewStatementsPage.verifyOnPage()
      viewStatementsPage.return().click()
    }

    {
      const { prisoner, reporter, prisonNumber, viewStatementsButton } = notCompletedIncidentsPage.getTodoRow(1)
      prisoner().contains('Smith, Norman')
      reporter().contains('Anne OtherUser')
      prisonNumber().contains('A1234AC')
      viewStatementsButton().click()

      const viewStatementsPage = ViewStatementsPage.verifyOnPage()
      viewStatementsPage.reportLink().click()

      const viewReportPage = ViewReportPage.verifyOnPage()
      viewReportPage.reporterName().contains('Anne OtherUser')
      viewReportPage.verifyInputs({ involvedStaff: ['Another User Name (ANOTHER_USER)'] })
      viewReportPage.returnToIncidentOverview().click()
    }
  })
})
