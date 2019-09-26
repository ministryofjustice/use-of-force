const moment = require('moment')
const AllIncidentsPage = require('../../pages/allIncidentsPage')
const ViewStatementsPage = require('../../pages/viewStatementsPage')
const ReviewStatementPage = require('../../pages/reviewStatementPage')

const { ReportStatus } = require('../../../server/config/types')

context('view statement page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  it('A reviewer can view statements for a specific report', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      overdueDate: moment()
        .add(1, 'day')
        .toDate(),
      userId: 'TEST_USER',
      reporterName: 'James Stuart',
      agencyId: 'MDI',
      bookingId,
      involvedStaff: [
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const allIncidentsPage = AllIncidentsPage.goTo()
    allIncidentsPage.getTodoRows().should('have.length', 1)

    {
      const { prisoner, reporter, viewStatementsButton } = allIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      viewStatementsButton().click()

      const viewStatementsPage = ViewStatementsPage.verifyOnPage()
      viewStatementsPage.reporterName().contains('James Stuart')
      viewStatementsPage.prisonerName().contains('Norman Smith')
      viewStatementsPage.prisonNumber().contains('A1234AC')

      viewStatementsPage.getReportId().then(reportId => cy.task('submitStatement', { userId: 'TEST_USER', reportId }))

      cy.reload()

      viewStatementsPage.statements().then(result => {
        expect(result).to.deep.equal([{ username: 'TEST_USER name', link: 'View statement', isOverdue: false }])
      })

      viewStatementsPage.statementLink(0).click()

      const reviewStatementPage = ReviewStatementPage.verifyOnPageForUser('TEST_USER name')

      reviewStatementPage.offenderName().contains('Norman Smith')
      reviewStatementPage.dateAndTime().contains(/10 September 2019 - \d{2}:\d{2}/)

      reviewStatementPage.lastTraining().contains('March 2018')
      reviewStatementPage.jobStartYear().contains('2017')
      reviewStatementPage.statement().contains('Things happened')
      reviewStatementPage.continue().click()

      ViewStatementsPage.verifyOnPage()
    }
  })
})
