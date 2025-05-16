const moment = require('moment')
const { offender } = require('../../mockApis/data')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const ViewReportPage = require('../../pages/reviewer/viewReportPage')
const YourReportsPage = require('../../pages/yourReports/yourReportsPage')
const YourReportPage = require('../../pages/yourReports/yourReportPage')
const ConfirmStatementDeletePage = require('../../pages/reviewer/confirmStatementDeletePage')
const CompletedIncidentsPage = require('../../pages/reviewer/completedIncidentsPage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')

const { ReportStatus } = require('../../../server/config/types')

context('A use of force coordinator can remove involved staff', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  const seedReport = () =>
    cy.task('seedReport', {
      username: 'TEST_USER',
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      agencyId: 'MDI',
      bookingId: 1001,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
        {
          username: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MRS_JONES@gov.uk',
        },
      ],
    })

  it(`A coordinator can remove staff on an otherwise complete report and it will complete the report. 
  And the report will not display in the Not completed incidents page`, () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    {
      const { prisoner, reporter, viewStatementsButton } = notCompletedIncidentsPage.getTodoRow(0)
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
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        { username: 'TEST_USER name', badge: '', link: 'View statement', isOverdue: false, isUnverified: false },
      ])
    )

    viewStatementsPage.reportLink().click()
    let reportPage = ViewReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('TEST_USER').should('not.exist')
    reportPage.deleteInvolvedStaff('MRS_JONES').should('be.visible').click()

    const confirmStatementDeletePage = ConfirmStatementDeletePage.verifyOnPage('MRS_JONES name')
    confirmStatementDeletePage.confirm()
    confirmStatementDeletePage.continue().click()

    reportPage = ViewReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('TEST_USER').should('not.exist')
    reportPage.deleteInvolvedStaff('MRS_JONES').should('not.exist')
    reportPage.returnToIncidentOverview().click()

    viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.return().click()

    const completedIncidentsPage = CompletedIncidentsPage.verifyOnPage()
    {
      const { prisoner, reporter, prisonNumber, viewStatementsButton } = completedIncidentsPage.getCompleteRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      viewStatementsButton().click()
    }
    completedIncidentsPage.getNoCompleteRows().should('not.exist')

    viewStatementsPage = ViewStatementsPage.verifyOnPage()

    viewStatementsPage
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'TEST_USER name', badge: '', link: 'View statement', isOverdue: false, isUnverified: false },
        ])
      )

    cy.task('getReportCount', [ReportStatus.SUBMITTED.value, ReportStatus.IN_PROGRESS.value]).then(count =>
      expect(count).to.equal(0)
    )
  })

  it(`When a coordinator views their own report they can remove staff on an otherwise complete report and it will complete the report. 
  And the report will be shown to be complete`, () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedReport()

    const yourReportsPage = YourReportsPage.goTo()

    {
      const { prisoner, action } = yourReportsPage.reports(0)
      prisoner().contains('Smith, Norman')
      action().click()
    }

    let reportPage = YourReportPage.verifyOnPage()

    reportPage
      .getReportId()
      .then(reportId => cy.task('submitStatement', { userId: 'TEST_USER', reportId }))
      .then(() => cy.reload())

    reportPage.deleteInvolvedStaff('TEST_USER').should('not.exist')
    reportPage.deleteInvolvedStaff('MRS_JONES').should('be.visible').click()

    const confirmStatementDeletePage = ConfirmStatementDeletePage.verifyOnPage('MRS_JONES name')
    confirmStatementDeletePage.confirm()
    confirmStatementDeletePage.continue().click()

    reportPage = YourReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('TEST_USER').should('not.exist')
    reportPage.deleteInvolvedStaff('MRS_JONES').should('not.exist')

    cy.task('getReportCount', [ReportStatus.SUBMITTED.value, ReportStatus.IN_PROGRESS.value]).then(count =>
      expect(count).to.equal(0)
    )
  })

  it('A reviewer user should not be able to remove staff', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    seedReport()

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    const { prisoner, reporter, prisonNumber, viewStatementsButton } = notCompletedIncidentsPage.getTodoRow(0)
    prisoner().contains('Smith, Norman')
    reporter().contains('James Stuart')
    prisonNumber().contains('A1234AC')
    viewStatementsButton().click()

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()

    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        { username: 'TEST_USER name', badge: '', link: '', isOverdue: false, isUnverified: false },
      ])
    )

    viewStatementsPage.reportLink().click()
    const reportPage = ViewReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('MRS_JONES').should('not.exist')
  })
})
