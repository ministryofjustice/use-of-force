const moment = require('moment')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const AllIncidentsPage = require('../../pages/reviewer/allIncidentsPage')
const ViewReportPage = require('../../pages/reviewer/viewReportPage')
const ConfirmStatementDeletePage = require('../../pages/reviewer/confirmStatementDeletePage')

const { ReportStatus } = require('../../../server/config/types')

context('A use of force coordinator can remove involved staff', () => {
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

  const seedReport = () =>
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      agencyId: 'MDI',
      bookingId: 1001,
      involvedStaff: [
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
        {
          userId: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MRS_JONES@gov.uk',
        },
      ],
    })

  it('A coordinator can remove staff on otherwise complete report and it will complete the report', () => {
    cy.task('stubCoordinatorLogin')
    cy.login(bookingId)

    seedReport()

    let allIncidentsPage = AllIncidentsPage.goTo()
    allIncidentsPage.getTodoRows().should('have.length', 1)
    allIncidentsPage.getNoCompleteRows().should('exist')

    {
      const { prisoner, reporter, viewStatementsButton } = allIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      viewStatementsButton().click()
    }

    let viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage
      .getReportId()
      .then(reportId => cy.task('submitStatement', { userId: 'TEST_USER', reportId }))
      .then(() => cy.reload())

    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', link: '', isOverdue: false, isUnverified: false },
        { username: 'TEST_USER name', link: 'View statement', isOverdue: false, isUnverified: false },
      ])
    )

    viewStatementsPage.reportLink().click()
    let reportPage = ViewReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('TEST_USER').should('be.visible')
    reportPage
      .deleteInvolvedStaff('MRS_JONES')
      .should('be.visible')
      .click()

    const confirmStatementDeletePage = ConfirmStatementDeletePage.verifyOnPage('MRS_JONES name')
    confirmStatementDeletePage.confirm()
    confirmStatementDeletePage.continue().click()

    reportPage = ViewReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('TEST_USER').should('be.visible')
    reportPage.deleteInvolvedStaff('MRS_JONES').should('not.be.visible')
    reportPage.continue().click()

    allIncidentsPage = AllIncidentsPage.verifyOnPage()
    allIncidentsPage.getNoTodoRows().should('exist')
    allIncidentsPage.getCompleteRows().should('have.length', 1)

    {
      const { prisoner, reporter, prisonNumber, viewStatementsButton } = allIncidentsPage.getCompleteRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      viewStatementsButton().click()
    }

    viewStatementsPage = ViewStatementsPage.verifyOnPage()

    viewStatementsPage
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'TEST_USER name', link: 'View statement', isOverdue: false, isUnverified: false },
        ])
      )
  })

  it('A reviewer user should not be able to remove staff', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    seedReport()

    const allIncidentsPage = AllIncidentsPage.goTo()
    allIncidentsPage.getTodoRows().should('have.length', 1)

    const { prisoner, reporter, prisonNumber, viewStatementsButton } = allIncidentsPage.getTodoRow(0)
    prisoner().contains('Smith, Norman')
    reporter().contains('James Stuart')
    prisonNumber().contains('A1234AC')
    viewStatementsButton().click()

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()

    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', link: '', isOverdue: false, isUnverified: false },
        { username: 'TEST_USER name', link: '', isOverdue: false, isUnverified: false },
      ])
    )

    viewStatementsPage.reportLink().click()
    const reportPage = ViewReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('MRS_JONES').should('not.be.visible')
  })
})
