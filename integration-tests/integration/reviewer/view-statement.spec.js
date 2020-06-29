const moment = require('moment')

const { offender } = require('../../mockApis/data')

const AllIncidentsPage = require('../../pages/reviewer/allIncidentsPage')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const ViewStatementPage = require('../../pages/reviewer/viewStatementPage')

const { ReportStatus } = require('../../../server/config/types')

context('view statement page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
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
        expect(result).to.deep.equal([
          { username: 'TEST_USER name', link: 'View statement', isOverdue: false, isUnverified: false },
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
