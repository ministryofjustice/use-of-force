const moment = require('moment')
const AllIncidentsPage = require('../../pages/allIncidentsPage')
const ViewReportPage = require('../../pages/viewReportPage')

const { ReportStatus } = require('../../../server/config/types')

context('view review page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS JONES')
    cy.task('stubUserDetailsRetrieval', 'Test User')
  })

  it('A reviewer can view reports they did and did not raise', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      userId: 'Test User',
      reporterName: 'James Stuart',
      agencyId: 'MDI',
      bookingId,
      involvedStaff: [
        {
          userId: 'Test User',
          name: 'Test User name',
          email: 'Test User@gov.uk',
        },
      ],
    })

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      userId: 'ANOTHER_USER',
      reporterName: 'Anne OtherUser',
      agencyId: 'MDI',
      bookingId,
      involvedStaff: [
        {
          userId: 'ANOTHER_USER',
          name: 'Another user name',
          email: 'Test User@gov.uk',
        },
      ],
    })

    const allIncidentsPage = AllIncidentsPage.goTo()
    allIncidentsPage.getTodoRows().should('have.length', 2)
    allIncidentsPage.getCompleteRows().should('have.length', 0)

    allIncidentsPage.selectedTab().contains('All incidents')

    {
      const { prisoner, reporter, viewReportButton } = allIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      viewReportButton().click()

      const viewReportPage = ViewReportPage.verifyOnPage()
      viewReportPage.reporterName().contains('James Stuart')
      viewReportPage.verifyInputs({ involvedStaff: ['Test User Name - Test User'] })
      viewReportPage.continue().click()
    }

    {
      const { prisoner, reporter, viewReportButton } = allIncidentsPage.getTodoRow(1)
      prisoner().contains('Smith, Norman')
      reporter().contains('Anne OtherUser')
      viewReportButton().click()

      const viewReportPage = ViewReportPage.verifyOnPage()
      viewReportPage.reporterName().contains('Anne OtherUser')
      viewReportPage.verifyInputs({ involvedStaff: ['Another User Name - ANOTHER_USER'] })
      viewReportPage.continue().click()
    }
  })
})
