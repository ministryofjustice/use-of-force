const moment = require('moment')
const { offender } = require('../../mockApis/data')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const CompletedIncidentsPage = require('../../pages/reviewer/completedIncidentsPage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const AddInvolvedStaffPage = require('../../pages/reviewer/addInvolvedStaffPage')
const AddInvolvedStaffResultPage = require('../../pages/reviewer/addInvolvedStaffResultPage')
const ViewReportPage = require('../../pages/reviewer/viewReportPage')
const { ReportStatus } = require('../../../server/config/types')

context('A use of force coordinator can add involved staff', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubDpsLocationMapping', 123456)
    cy.task('stubPrisons')
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.task('stubUnverifiedUserDetailsRetrieval', 'UNVERIFIED_USER')
  })

  const seedReport = () =>
    cy.task('seedReport', {
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
      ],
    })

  const seedAndCompleteReport = () => {
    seedReport()

    let notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    const { reportId } = notCompletedIncidentsPage.getTodoRow(0)
    reportId().then(id => cy.task('submitStatement', { userId: 'TEST_USER', reportId: id }).then(() => cy.reload()))

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRows().should('have.length', 1)

    notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getNoTodoRows().should('exist')
  }

  it('A coordinator can add staff on a complete report and it will move the report to incomplete', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedAndCompleteReport()

    const completedIncidentsPage = CompletedIncidentsPage.goTo()
    completedIncidentsPage.getCompleteRow(0).viewStatementsButton().click()

    let viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        {
          username: 'TEST_USER name',
          badge: '',
          link: 'View statement',
          isOverdue: false,
          isUnverified: false,
        },
      ])
    )
    viewStatementsPage.reportLink().click()

    ViewReportPage.verifyOnPage().addInvolvedStaff().should('be.visible').click()

    const addInvolvedStaffPage = AddInvolvedStaffPage.verifyOnPage()
    addInvolvedStaffPage.username().type('MRS_JONES')
    addInvolvedStaffPage.saveAndContinue().click()

    const reportPage = ViewReportPage.verifyOnPage()
    reportPage.deleteInvolvedStaff('MRS_JONES').should('be.visible')
    reportPage.returnToIncidentOverview().click()

    viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.return().click()

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.verifyOnPage()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)
    notCompletedIncidentsPage.getTodoRow(0).viewStatementsButton().click()

    ViewStatementsPage.verifyOnPage()
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
          { username: 'TEST_USER name', badge: '', link: 'View statement', isOverdue: false, isUnverified: false },
        ])
      )

    cy.task('getReportCount', [ReportStatus.COMPLETE.value]).then(count => expect(count).to.equal(0))
  })

  it('Attempting to add a missing staff member', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedAndCompleteReport()

    CompletedIncidentsPage.goTo().getCompleteRow(0).viewStatementsButton().click()

    ViewStatementsPage.verifyOnPage().reportLink().click()

    ViewReportPage.verifyOnPage().addInvolvedStaff().should('be.visible').click()

    const addInvolvedStaffPage = AddInvolvedStaffPage.verifyOnPage()
    addInvolvedStaffPage.username().type('JOHNNY')
    addInvolvedStaffPage.saveAndContinue().click()

    const warningPage = AddInvolvedStaffResultPage.verifyOnPage('The username does not exist')
    warningPage.continue().click()

    AddInvolvedStaffPage.verifyOnPage()
  })

  it('Attempting to re-add an existing staff member', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedAndCompleteReport()

    CompletedIncidentsPage.goTo().getCompleteRow(0).viewStatementsButton().click()

    ViewStatementsPage.verifyOnPage().reportLink().click()

    ViewReportPage.verifyOnPage().addInvolvedStaff().should('be.visible').click()

    const addInvolvedStaffPage = AddInvolvedStaffPage.verifyOnPage()
    addInvolvedStaffPage.username().type('TEST_USER')
    addInvolvedStaffPage.saveAndContinue().click()

    const warningPage = AddInvolvedStaffResultPage.verifyOnPage('TEST_USER name has already been added to the report')
    warningPage.continue().click()

    ViewReportPage.verifyOnPage()
  })

  it('Attempting to add an unverified staff member', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedAndCompleteReport()

    CompletedIncidentsPage.goTo().getCompleteRow(0).viewStatementsButton().click()

    ViewStatementsPage.verifyOnPage().reportLink().click()

    ViewReportPage.verifyOnPage().addInvolvedStaff().should('be.visible').click()

    const addInvolvedStaffPage = AddInvolvedStaffPage.verifyOnPage()
    addInvolvedStaffPage.username().type('UNVERIFIED_USER')
    addInvolvedStaffPage.saveAndContinue().click()

    const warningPage = AddInvolvedStaffResultPage.verifyOnPage(
      'UNVERIFIED_USER name has not verified their email address'
    )
    warningPage.continue().click()

    ViewReportPage.verifyOnPage()
  })

  it('A reviewer user should not be able to add staff', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    seedReport()

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    const { prisoner, reporter, viewStatementsButton } = notCompletedIncidentsPage.getTodoRow(0)
    prisoner().contains('Smith, Norman')
    reporter().contains('James Stuart')
    viewStatementsButton().click()

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()

    viewStatementsPage
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'TEST_USER name', badge: '', link: '', isOverdue: false, isUnverified: false },
        ])
      )

    viewStatementsPage.reportLink().click()
    const reportPage = ViewReportPage.verifyOnPage()
    reportPage.addInvolvedStaff().should('not.exist')
    reportPage.prison().contains('Moorland')
    reportPage.location().contains('ASSO')
  })
})
