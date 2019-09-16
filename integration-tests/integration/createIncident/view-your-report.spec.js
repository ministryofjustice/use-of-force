const YourStatementsPage = require('../../pages/yourStatementsPage')
const YourReportPage = require('../../pages/yourReportPage')
const YourReportsPage = require('../../pages/yourReportsPage')
const { ReportStatus } = require('../../../server/config/types')

context('Submit statement', () => {
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
    cy.task('stubUserDetailsRetrieval', 'Test User')
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
          userId: 'Test User',
          name: 'Test User name',
          email: 'Test User@gov.uk',
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
    yourReportPage.submittedDate().contains('10 September 2019, 10:30')
    yourReportPage.verifyInputs()

    yourReportPage.continue().click()

    YourStatementsPage.verifyOnPage()
  })
})
