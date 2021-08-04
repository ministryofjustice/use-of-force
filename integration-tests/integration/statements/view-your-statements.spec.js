const moment = require('moment')
const { offender, offender2, offender3 } = require('../../mockApis/data')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const { ReportStatus } = require('../../../server/config/types')

context('A user views their statements list', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderDetails', offender2)
    cy.task('stubOffenderDetails', offender3)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender, offender2, offender3])
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('A user can view all of their statements', () => {
    cy.login()

    cy.task('seedReports', [
      {
        status: ReportStatus.SUBMITTED,
        submittedDate: moment().toDate(),
        incidentDate: moment('2019-09-10 09:57:40.000').toDate(),
        involvedStaff: [
          {
            username: 'TEST_USER',
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
          },
        ],
      },
      {
        status: ReportStatus.SUBMITTED,
        submittedDate: moment().toDate(),
        agencyId: offender.agencyId,
        offenderNumber: offender2.offenderNo,
        bookingId: offender2.bookingId,
        incidentDate: moment('2019-09-09 07:57:40.000').toDate(),
        overdueDate: moment().subtract(4, 'd').toDate(),
        involvedStaff: [
          {
            username: 'TEST_USER',
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
          },
          {
            username: 'MR_ZAGATO',
            name: 'MR_ZAGATO name',
            email: 'MR_ZAGATO@gov.uk',
          },
        ],
      },
      {
        status: ReportStatus.SUBMITTED,
        submittedDate: moment().toDate(),
        agencyId: offender.agencyId,
        offenderNumber: offender3.offenderNo,
        bookingId: offender3.bookingId,
        incidentDate: moment('2019-09-09 06:57:40.000').toDate(),
        overdueDate: moment().subtract(4, 'd').toDate(),
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
      },
    ]).then(statementIds => {
      cy.task('requestRemovalFromStatement', { statementId: statementIds[2].TEST_USER, reason: 'not working' })
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.selectedTab().contains('Your statements')
    yourStatementsPage.pagination().should('not.exist')

    {
      const { date, prisoner, overdue, removalRequested, action } = yourStatementsPage.statements(0)
      prisoner().contains('Smith, Norman')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('not.exist')
      removalRequested().should('not.exist')
      action().should('contain.text', 'Start')
    }

    {
      const { date, prisoner, overdue, removalRequested, action } = yourStatementsPage.statements(1)
      prisoner().contains('Jones, June')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('exist')
      removalRequested().should('not.exist')
      action().should('contain.text', 'Start')
    }

    {
      const { date, prisoner, overdue, removalRequested, action } = yourStatementsPage.statements(2)
      prisoner().contains('Smith, Simon')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('not.exist')
      removalRequested().should('exist')
      action().should('contain.text', 'Start')
    }
  })

  it('A user can view pagination', () => {
    cy.task('stubOffenders', [offender])
    cy.login()

    cy.task(
      'seedReports',
      Array.from(Array(62)).map((_, i) => ({
        status: ReportStatus.SUBMITTED,
        bookingId: i,
        involvedStaff: [
          {
            username: 'TEST_USER',
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
          },
        ],
      }))
    )

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.selectedTab().contains('Your statements')
    yourStatementsPage.pagination().should('be.visible')

    yourStatementsPage
      .pageResults()
      .should(results => expect(results.text()).to.contain('Showing 1 to 20 of 62 results'))

    yourStatementsPage.pageLinks().then(pageLinks =>
      expect(pageLinks).to.deep.equal([
        { href: undefined, text: '1', selected: true },
        { href: '?page=2', text: '2', selected: false },
        { href: '?page=3', text: '3', selected: false },
        { href: '?page=4', text: '4', selected: false },
        { href: '?page=2', text: 'Next set of pages', selected: false },
      ])
    )
    yourStatementsPage.clickLinkWithText('Next set of pages')
    yourStatementsPage.pageLinks().then(pageLinks =>
      expect(pageLinks).to.deep.equal([
        { href: '?page=1', text: 'Previous set of pages', selected: false },
        { href: '?page=1', text: '1', selected: false },
        { href: undefined, text: '2', selected: true },
        { href: '?page=3', text: '3', selected: false },
        { href: '?page=4', text: '4', selected: false },
        { href: '?page=3', text: 'Next set of pages', selected: false },
      ])
    )

    yourStatementsPage.clickLinkWithText('4')
    yourStatementsPage.pageLinks().then(pageLinks =>
      expect(pageLinks).to.deep.equal([
        { href: '?page=3', text: 'Previous set of pages', selected: false },
        { href: '?page=1', text: '1', selected: false },
        { href: '?page=2', text: '2', selected: false },
        { href: '?page=3', text: '3', selected: false },
        { href: undefined, text: '4', selected: true },
      ])
    )

    yourStatementsPage.clickLinkWithText('Previous set of pages')
    yourStatementsPage.pageLinks().then(pageLinks =>
      expect(pageLinks).to.deep.equal([
        { href: '?page=2', text: 'Previous set of pages', selected: false },
        { href: '?page=1', text: '1', selected: false },
        { href: '?page=2', text: '2', selected: false },
        { href: undefined, text: '3', selected: true },
        { href: '?page=4', text: '4', selected: false },
        { href: '?page=4', text: 'Next set of pages', selected: false },
      ])
    )
  })

  it('Page should display the feedback banner with the correct href', () => {
    cy.task('stubOffenders', [offender])
    cy.login()

    cy.task(
      'seedReports',
      Array.from(Array(62)).map((_, i) => ({
        status: ReportStatus.SUBMITTED,
        bookingId: i,
        involvedStaff: [
          {
            username: 'TEST_USER',
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
          },
        ],
      }))
    )

    const yourStatementsPage = YourStatementsPage.goTo()

    yourStatementsPage
      .feedbackBannerLink()
      .should('contain', 'Give feedback on this service')
      .should('have.attr', 'href')
      .then(href => {
        expect(href).to.equal('https://eu.surveymonkey.com/r/GYB8Y9Q?source=localhost/your-statements')
      })
  })
})
