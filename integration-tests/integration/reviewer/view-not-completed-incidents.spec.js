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
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderDetails', offender2)
    cy.task('stubOffenderDetails', offender3)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '357591')
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
      offenderNo: 'A1234AD',
      bookingId: 1002,
      involvedStaff: [
        {
          userId: 'TEST_USER',
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
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('not.exist')
    }
  })

  it('A reviewer can filter incidents', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    cy.task('stubOffenders', [offender, offender2, offender3])

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      incidentDate: moment('2019-01-25 09:57:40.000'),
      agencyId: offender.agencyId,
      bookingId: offender.bookingId,
      offenderNumber: offender.offenderNo,
      userId: 'R_SMITH',
      reporterName: 'Robert James',
      sequenceNumber: 2,
    })

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      incidentDate: moment('2019-01-27 09:57:40.000'),
      agencyId: offender2.agencyId,
      bookingId: offender2.bookingId,
      offenderNumber: offender2.offenderNo,
      userId: 'R_JAMES',
      reporterName: 'Robert James',
      sequenceNumber: 3,
      involvedStaff: [
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      incidentDate: moment('2019-01-30 09:57:40.000'),
      agencyId: offender3.agencyId,
      bookingId: offender3.bookingId,
      offenderNumber: offender3.offenderNo,
      involvedStaff: [
        {
          userId: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MRS_JONES@gov.uk',
        },
      ],
    })

    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 3)

    {
      const { date, prisoner, prisonNumber, reporter, overdue } = notCompletedIncidentsPage.getTodoRow(0)
      date().contains('25 Jan 2019')
      prisoner().contains('Smith, Norman')
      prisonNumber().contains('A1234AC')
      reporter().contains('Robert James')
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
          userId: 'TEST_USER',
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
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
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
