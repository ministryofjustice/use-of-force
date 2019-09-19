const moment = require('moment')
const AllIncidentsPage = require('../../pages/allIncidentsPage')
const ViewStatementsPage = require('../../pages/viewStatementsPage')

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

  it('A reviewer can view statements for a specific report', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      overdueDate: moment()
        .add(1, 'day')
        .toDate(),
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
        {
          userId: 'ANOTHER_USER',
          name: 'Another user name',
          email: 'Anneother Test User@gov.uk',
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

      viewStatementsPage
        .statements()
        .then(result =>
          expect(result).to.deep.equal([
            { username: 'Another user name', link: '', isOverdue: false },
            { username: 'Test User name', link: '', isOverdue: false },
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
        {
          userId: 'ANOTHER_USER',
          name: 'Another user name',
          email: 'Anneother Test User@gov.uk',
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

    viewStatementsPage
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'Another user name', link: 'OVERDUE', isOverdue: true },
          { username: 'Test User name', link: 'OVERDUE', isOverdue: true },
        ])
      )

    viewStatementsPage.return().click()

    AllIncidentsPage.verifyOnPage()
  })
})
