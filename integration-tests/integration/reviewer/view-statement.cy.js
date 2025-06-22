const moment = require('moment')
const { offender } = require('../../mockApis/data')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const ViewStatementPage = require('../../pages/reviewer/viewStatementPage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const { ReportStatus } = require('../../../server/config/types')

context('view statement page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('A reviewer can view statements for a specific report', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      overdueDate: moment().add(1, 'day').toDate(),
      userId: 'TEST_USER',
      reporterName: 'James Stuart',
      agencyId: 'MDI',
      bookingId,
      involvedStaff: [
        {
          username: 'TEST_USER (TEST_USER)',
          email: 'TEST_USER@gov.uk',
          name: 'TEST_USER name',
        },
      ],
    })

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    {
      const { prisoner, reporter, viewStatementsButton } = notCompletedIncidentsPage.getTodoRow(0)
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
        expect(result).to.deep.equal([
          {
            username: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
            badge: 'EMAIL NOT VERIFIED',
            link: 'View statement',
            isOverdue: false,
            isUnverified: true,
          },
        ])
      })

      viewStatementsPage.statementLink(0).click()

      const viewStatementPage = ViewStatementPage.verifyOnPageForUser('TEST_USER name')

      viewStatementPage.offenderName().contains('Norman Smith')
      viewStatementPage.dateAndTime().contains(/10 September 2019 - \d{2}:\d{2}/)

      viewStatementPage.lastTraining().contains('March 2018')
      viewStatementPage.jobStartYear().contains('2017')
      viewStatementPage.statement().contains('Things happened')
      viewStatementPage.continue().click()

      ViewStatementsPage.verifyOnPage()
    }
  })
})
