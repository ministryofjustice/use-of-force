const moment = require('moment')
const { offender } = require('../../mockApis/data')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const { ReportStatus } = require('../../../server/config/types')

const offender2 = {
  bookingId: 1002,
  offenderNo: 'A1234AD',
  firstName: 'JUNE',
  lastName: 'JONES',
  agencyId: 'MDI',
  dateOfBirth: '2000-12-26',
}

const offender3 = {
  bookingId: 1003,
  offenderNo: 'A1234AE',
  firstName: 'TOM',
  lastName: 'TRAVES',
  agencyId: 'MDI',
  dateOfBirth: '2000-12-26',
}

context('A use of force reviewer can view incidents at the current agency', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderDetails', offender2)
    cy.task('stubOffenderDetails', offender3)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('A reviewer can view the un-completed incidents', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    // A report which on the current reviewers caseload, and which is displayed
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
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

    // A report which isn't on the current reviewers caseload, which isn't displayed
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      agencyId: 'LEI',
      offenderNo: 'A1234AD',
      bookingId: 1002,
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

    notCompletedIncidentsPage
      .allTabs()
      .then(allTabs => expect(allTabs).to.deep.equal(['Not completed', 'Completed', 'Your statements', 'Your reports']))

    notCompletedIncidentsPage.selectedTab().contains('Not completed')

    {
      const { date, prisoner, prisonNumber, reporter, overdue } = notCompletedIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      prisonNumber().contains('A1234AC')
      reporter().contains('James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{2}[/]\d{2}[/]\d{4}/))
      overdue().should('not.exist')
    }
  })

  it('A reviewer can view overdue incidents', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().add(-4, 'days').toDate(),
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()

    notCompletedIncidentsPage
      .allTabs()
      .then(allTabs => expect(allTabs).to.deep.equal(['Not completed', 'Completed', 'Your statements', 'Your reports']))

    notCompletedIncidentsPage.selectedTab().contains('Not completed')
    notCompletedIncidentsPage.exitLink().then(location => expect(location).to.equal('/'))

    {
      const { date, prisoner, prisonNumber, reporter, overdue } = notCompletedIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      date().should(elem => expect(elem.text()).to.match(/\d{2}[/]\d{2}[/]\d{4}/))
      overdue().should('exist')
    }
  })

  it('A normal user cannot view any incidents', () => {
    cy.task('stubLogin')
    cy.login()

    const yourStatementsPage = YourStatementsPage.goTo()

    yourStatementsPage.allTabs().then(allTabs => expect(allTabs).to.deep.equal(['Your statements', 'Your reports']))

    yourStatementsPage.selectedTab().contains('Your statements')
  })
})
