const moment = require('moment')
const { offender } = require('../../mockApis/data')
const ViewStatementsPage = require('../../pages/reviewer/viewStatementsPage')
const ViewRemovalRequestPage = require('../../pages/coordinator/viewRemovalRequestPage')
const ConfirmStatementDeletePage = require('../../pages/reviewer/confirmStatementDeletePage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const StaffMemberNotRemovedPage = require('../../pages/coordinator/staffMemberNotRemovedPage')
const { ReportStatus } = require('../../../server/config/types')

context('A use of force coordinator can accept or refuse removal statement requests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MRS_JONES', 'TEST_USER'])
  })

  const seedReport = () =>
    cy
      .task('seedReport', {
        status: ReportStatus.SUBMITTED,
        submittedDate: moment().toDate(),
        incidentDate: moment('2019-09-10 09:57:40.000').toDate(),
        involvedStaff: [
          {
            username: 'MRS_JONES',
            name: 'MRS_JONES name',
            email: 'MRS_JONES@gov.uk',
          },
          {
            username: 'TEST_USER',
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
          },
        ],
      })
      .then(statements => {
        cy.task('requestRemovalFromStatement', { statementId: statements.TEST_USER, reason: 'not working' })
      })

  it(`A coordinator can accept a statment removal request`, () => {
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

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        {
          username: 'TEST_USER name',
          badge: 'REMOVAL REQUEST',
          link: 'View removal request',
          isOverdue: false,
          isUnverified: false,
        },
      ])
    )
    viewStatementsPage.statementLink(1).click()

    const viewRemovalRequestPage = ViewRemovalRequestPage.verifyOnPage()
    viewRemovalRequestPage.name().contains('TEST_USER name')
    viewRemovalRequestPage.userId().contains('TEST_USER')
    viewRemovalRequestPage.location().contains('Moorland')
    viewRemovalRequestPage.emailAddress().contains('TEST_USER@gov.uk')
    viewRemovalRequestPage.removalReason().contains('not working')
    viewRemovalRequestPage.confirm()
    viewRemovalRequestPage.continue().click()

    const confirmStatementDeletePage = ConfirmStatementDeletePage.verifyOnPage('TEST_USER name')
    confirmStatementDeletePage.confirm()
    confirmStatementDeletePage.continue().click()

    viewStatementsPage
      .statements()
      .then(result =>
        expect(result).to.deep.equal([
          { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        ])
      )
  })

  it(`A coordinator can refuse a statment removal request`, () => {
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

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        {
          username: 'TEST_USER name',
          badge: 'REMOVAL REQUEST',
          link: 'View removal request',
          isOverdue: false,
          isUnverified: false,
        },
      ])
    )
    viewStatementsPage.statementLink(1).click()

    const viewRemovalRequestPage = ViewRemovalRequestPage.verifyOnPage()
    viewRemovalRequestPage.name().contains('TEST_USER name')
    viewRemovalRequestPage.userId().contains('TEST_USER')
    viewRemovalRequestPage.location().contains('Moorland')
    viewRemovalRequestPage.emailAddress().contains('TEST_USER@gov.uk')
    viewRemovalRequestPage.removalReason().contains('not working')
    viewRemovalRequestPage.refuse().click()
    viewRemovalRequestPage.continue().click()

    const staffMemberNotRemovedPage = StaffMemberNotRemovedPage.verifyOnPage()
    staffMemberNotRemovedPage.name().contains('TEST_USER name')
    staffMemberNotRemovedPage.return().click()

    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        {
          username: 'TEST_USER name',
          badge: '',
          link: '',
          isOverdue: false,
          isUnverified: false,
        },
      ])
    )
  })

  it(`A coordinator can change their mind about accepting a statment removal request`, () => {
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

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        {
          username: 'TEST_USER name',
          badge: 'REMOVAL REQUEST',
          link: 'View removal request',
          isOverdue: false,
          isUnverified: false,
        },
      ])
    )
    viewStatementsPage.statementLink(1).click()

    const viewRemovalRequestPage = ViewRemovalRequestPage.verifyOnPage()
    viewRemovalRequestPage.name().contains('TEST_USER name')
    viewRemovalRequestPage.userId().contains('TEST_USER')
    viewRemovalRequestPage.location().contains('Moorland')
    viewRemovalRequestPage.emailAddress().contains('TEST_USER@gov.uk')
    viewRemovalRequestPage.removalReason().contains('not working')
    viewRemovalRequestPage.confirm()
    viewRemovalRequestPage.continue().click()

    const confirmStatementDeletePage = ConfirmStatementDeletePage.verifyOnPage('TEST_USER name')
    confirmStatementDeletePage.refuse()
    confirmStatementDeletePage.continue().click()

    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        {
          username: 'TEST_USER name',
          badge: 'REMOVAL REQUEST',
          link: 'View removal request',
          isOverdue: false,
          isUnverified: false,
        },
      ])
    )
  })

  it(`A coordinator is shown a validation message when they neither accept or refuse a statment removal request`, () => {
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

    const viewStatementsPage = ViewStatementsPage.verifyOnPage()
    viewStatementsPage.statements().then(result =>
      expect(result).to.deep.equal([
        { username: 'MRS_JONES name', badge: '', link: '', isOverdue: false, isUnverified: false },
        {
          username: 'TEST_USER name',
          badge: 'REMOVAL REQUEST',
          link: 'View removal request',
          isOverdue: false,
          isUnverified: false,
        },
      ])
    )
    viewStatementsPage.statementLink(1).click()

    const viewRemovalRequestPage = ViewRemovalRequestPage.verifyOnPage()
    viewRemovalRequestPage.name().contains('TEST_USER name')
    viewRemovalRequestPage.userId().contains('TEST_USER')
    viewRemovalRequestPage.location().contains('Moorland')
    viewRemovalRequestPage.emailAddress().contains('TEST_USER@gov.uk')
    viewRemovalRequestPage.removalReason().contains('not working')
    viewRemovalRequestPage.continue().click()

    viewRemovalRequestPage.errorSummaryTitle().contains('There is a problem')
    viewRemovalRequestPage.errorSummaryBody().contains('Select yes if you want to remove this person from the incident')
    viewRemovalRequestPage.inlineError().contains('Select yes if you want to remove this person from the incident')
  })
})
