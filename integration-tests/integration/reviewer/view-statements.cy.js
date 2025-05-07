const moment = require('moment')
const { offender } = require('../../mockApis/data')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const ViewReportPage = require('../../pages/reviewer/viewReportPage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const { ReportStatus } = require('../../../server/config/types')

context('view statements page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.task('stubUnverifiedUserDetailsRetrieval', 'ANOTHER_USER')
  })

  it('A reviewer can view statements for a specific report', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      overdueDate: moment().add(1, 'day').toDate(),
      username: 'TEST_USER',
      reporterName: 'James Stuart',
      agencyId: offender.agencyId,
      bookingId: offender.bookingId,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
        {
          username: 'ANOTHER_USER',
          name: 'Another user name',
          email: 'Anneother TEST_USER@gov.uk',
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

      viewStatementsPage.statements().then(result =>
        expect(result).to.deep.equal([
          {
            username: 'Another user name (ANOTHER_USER)',
            email: 'Anneother TEST_USER@gov.uk',
            badge: 'EMAIL NOT VERIFIED',
            link: '',
            isOverdue: false,
            isUnverified: true,
          },
          {
            username: 'TEST_USER name (TEST_USER)',
            email: 'TEST_USER@gov.uk',
            badge: '',
            link: '',
            isOverdue: false,
            isUnverified: false,
          },
        ])
      )

      viewStatementsPage.return().click()
      NotCompletedIncidentsPage.verifyOnPage()
    }
  })

  it('A reviewer can view overdue statements for a specific report', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      overdueDate: moment().add(-1, 'day').toDate(),
      username: 'TEST_USER',
      reporterName: 'James Stuart',
      agencyId: offender.agencyId,
      bookingId: offender.bookingId,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
        {
          username: 'ANOTHER_USER',
          name: 'Another user name',
          email: 'Anneother TEST_USER@gov.uk',
        },
      ],
    })

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    const { viewStatementsButton } = notCompletedIncidentsPage.getTodoRow(0)
    viewStatementsButton().click()

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.reporterName().contains('James Stuart')
    viewStatementsPage.prisonerName().contains('Norman Smith')
    viewStatementsPage.prisonNumber().contains('A1234AC')

    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        {
          username: 'Another user name (ANOTHER_USER)',
          email: 'Anneother TEST_USER@gov.uk',
          badge: 'OVERDUE, EMAIL NOT VERIFIED',
          link: '',
          isOverdue: true,
          isUnverified: true,
        },
        {
          username: 'TEST_USER name (TEST_USER)',
          email: 'TEST_USER@gov.uk',
          badge: 'OVERDUE',
          link: '',
          isOverdue: true,
          isUnverified: false,
        },
      ])
    )

    viewStatementsPage.return().click()

    NotCompletedIncidentsPage.verifyOnPage()
  })

  it('A reviewer can view associated report', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      overdueDate: moment().add(1, 'day').toDate(),
      username: 'TEST_USER',
      reporterName: 'James Stuart',
      agencyId: offender.agencyId,
      bookingId: offender.bookingId,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
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

      viewStatementsPage.reportTab().click()

      ViewReportPage.verifyOnPage()
    }
  })
})
