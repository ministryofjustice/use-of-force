const moment = require('moment')
const { offender } = require('../../mockApis/data')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const AllIncidentsPage = require('../../pages/reviewer/allIncidentsPage')
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
    cy.task('stubPrisons')
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '357591')
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
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

  const seedAndCompleteReport = () => {
    seedReport()

    const allIncidentsPage = AllIncidentsPage.goTo()
    allIncidentsPage.getTodoRows().should('have.length', 1)
    allIncidentsPage.getNoCompleteRows().should('exist')

    const { reportId } = allIncidentsPage.getTodoRow(0)
    reportId().then(id => cy.task('submitStatement', { userId: 'TEST_USER', reportId: id }).then(() => cy.reload()))

    allIncidentsPage.getNoTodoRows().should('exist')
    allIncidentsPage.getCompleteRows().should('have.length', 1)
  }

  it('A coordinator can add staff on a complete report and it will complete the report', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedAndCompleteReport()

    AllIncidentsPage.goTo().getCompleteRow(0).viewStatementsButton().click()

    let viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'TEST_USER name', link: 'View statement', isOverdue: false, isUnverified: false },
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

    const allIncidentsPage = AllIncidentsPage.verifyOnPage()
    allIncidentsPage.getTodoRows().should('have.length', 1)
    allIncidentsPage.getNoCompleteRows().should('exist')
    allIncidentsPage.getTodoRow(0).viewStatementsButton().click()

    ViewStatementsPage.verifyOnPage()
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'MRS_JONES name', link: '', isOverdue: false, isUnverified: false },
          { username: 'TEST_USER name', link: 'View statement', isOverdue: false, isUnverified: false },
        ])
      )
  })

  it('Attempting to add a missing staff member', () => {
    cy.task('stubCoordinatorLogin')
    cy.login()

    seedAndCompleteReport()

    AllIncidentsPage.goTo().getCompleteRow(0).viewStatementsButton().click()

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

    AllIncidentsPage.goTo().getCompleteRow(0).viewStatementsButton().click()

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

    AllIncidentsPage.goTo().getCompleteRow(0).viewStatementsButton().click()

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

    const allIncidentsPage = AllIncidentsPage.goTo()
    allIncidentsPage.getTodoRows().should('have.length', 1)

    const { prisoner, reporter, viewStatementsButton } = allIncidentsPage.getTodoRow(0)
    prisoner().contains('Smith, Norman')
    reporter().contains('James Stuart')
    viewStatementsButton().click()

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()

    viewStatementsPage
      .statements()
      .then(result =>
        expect(result).to.deep.equal([{ username: 'TEST_USER name', link: '', isOverdue: false, isUnverified: false }])
      )

    viewStatementsPage.reportLink().click()
    const reportPage = ViewReportPage.verifyOnPage()
    reportPage.addInvolvedStaff().should('not.be.visible')
  })
})
