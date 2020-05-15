const moment = require('moment')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const AllIncidentsPage = require('../../pages/reviewer/allIncidentsPage')

const { ReportStatus } = require('../../../server/config/types')

context('A use of force reviewer can view all incidents at the current agency', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubPrison', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  it('A reviewer can view all incidents', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    // A report which on the current reviewers caseload, which is displayed
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

    // A report which isn't on the current reviewers caseload, which isn't displayed
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      agencyId: 'LEI',
      bookingId: 1002,
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
    allIncidentsPage.getNoCompleteRows().should('exist')

    allIncidentsPage
      .allTabs()
      .then(allTabs => expect(allTabs).to.deep.equal(['All incidents', 'Your statements', 'Your reports']))

    allIncidentsPage.selectedTab().contains('All incidents')

    {
      const { date, prisoner, prisonNumber, reporter, overdue } = allIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      prisonNumber().contains('A1234AC')
      reporter().contains('James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('not.exist')
    }
  })

  it('A reviewer can view overdue incidents', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment()
        .add(-4, 'days')
        .toDate(),
      involvedStaff: [
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const allIncidentsPage = AllIncidentsPage.goTo()

    allIncidentsPage
      .allTabs()
      .then(allTabs => expect(allTabs).to.deep.equal(['All incidents', 'Your statements', 'Your reports']))

    allIncidentsPage.selectedTab().contains('All incidents')
    allIncidentsPage.exitLink().then(location => expect(location).to.equal('/'))

    {
      const { date, prisoner, prisonNumber, reporter, overdue } = allIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('exist')
    }
  })

  it('A normal user cannot view all incidents', () => {
    cy.task('stubLogin')
    cy.login(bookingId)

    const yourStatementsPage = YourStatementsPage.goTo()

    yourStatementsPage.allTabs().then(allTabs => expect(allTabs).to.deep.equal(['Your statements', 'Your reports']))

    yourStatementsPage.selectedTab().contains('Your statements')
  })
})
