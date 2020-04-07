const moment = require('moment')
const AllIncidentsPage = require('../../pages/reviewer/allIncidentsPage')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const ViewReportPage = require('../../pages/reviewer/viewReportPage')

const { ReportStatus } = require('../../../server/config/types')

context('view statements page', () => {
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
        {
          userId: 'ANOTHER_USER',
          name: 'Another user name',
          email: 'Anneother TEST_USER@gov.uk',
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

      viewStatementsPage.statements().then(result =>
        expect(result).to.deep.equal([
          { username: 'Another user name', link: 'EMAIL NOT VERIFIED', isOverdue: false, isUnverified: true },
          { username: 'TEST_USER name', link: '', isOverdue: false, isUnverified: false },
        ])
      )

      viewStatementsPage.return().click()

      AllIncidentsPage.verifyOnPage()
    }
  })

  it('A reviewer can view overdue statements for a specific report', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      overdueDate: moment()
        .add(-1, 'day')
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
        {
          userId: 'ANOTHER_USER',
          name: 'Another user name',
          email: 'Anneother TEST_USER@gov.uk',
        },
      ],
    })

    const allIncidentsPage = AllIncidentsPage.goTo()
    allIncidentsPage.getTodoRows().should('have.length', 1)

    const { viewStatementsButton } = allIncidentsPage.getTodoRow(0)
    viewStatementsButton().click()

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.reporterName().contains('James Stuart')
    viewStatementsPage.prisonerName().contains('Norman Smith')
    viewStatementsPage.prisonNumber().contains('A1234AC')

    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'Another user name', link: 'EMAIL NOT VERIFIED, OVERDUE', isOverdue: true, isUnverified: true },
        { username: 'TEST_USER name', link: 'OVERDUE', isOverdue: true, isUnverified: false },
      ])
    )

    viewStatementsPage.return().click()

    AllIncidentsPage.verifyOnPage()
  })

  it('A reviewer can view associated report', () => {
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

      viewStatementsPage.reportLink().click()

      ViewReportPage.verifyOnPage()
    }
  })
})
