const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const YourReportPage = require('../../pages/yourReports/yourReportPage')
const YourReportsPage = require('../../pages/yourReports/yourReportsPage')
const { ReportStatus } = require('../../../server/config/types')

context('A reporter views their own report', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  it('A user can submit their statement from incidents page', () => {
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: '2019-09-04 11:27:52',
      involvedStaff: [
        {
          userId: 'MR_ZAGATO',
          name: 'MR_ZAGATO name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          userId: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.selectedTab().contains('Your statements')
    yourStatementsPage.yourReportsTab().click()

    const yourReportsPage = YourReportsPage.verifyOnPage()
    yourReportsPage.selectedTab().contains('Your reports')

    yourReportsPage
      .getCompleteRow(0)
      .viewButton()
      .click()

    const yourReportPage = YourReportPage.verifyOnPage()
    yourReportPage.reporterName().contains('James Stuart')
    yourReportPage.prisonerName().contains('Norman Smith')
    yourReportPage.prisonNumber().contains('A1234AC')
    yourReportPage.submittedDate().contains(/4 September 2019, \d{2}:\d{2}/)
    yourReportPage.getReportId().then(reportId => {
      yourReportPage.incidentNumber().contains(reportId)
    })
    yourReportPage.verifyInputs()

    yourReportPage.continue().click()

    YourStatementsPage.verifyOnPage()
  })
})
