const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const YourReportsPage = require('../../pages/yourReports/yourReportsPage')
const { ReportStatus } = require('../../../server/config/types')

context('A reporter views their report list', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('A user can view all of their reports', () => {
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      involvedStaff: [
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.fillForm()
    incidentDetailsPage.save()

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.selectedTab().contains('Your statements')
    yourStatementsPage.exitLink().then(location => expect(location).to.equal('/'))

    yourStatementsPage.yourReportsTab().click()

    const yourReportsPage = YourReportsPage.verifyOnPage()

    yourReportsPage.selectedTab().contains('Your reports')
    yourReportsPage.exitLink().then(location => expect(location).to.equal('/'))

    {
      const { action, date, prisoner } = yourReportsPage.reports(1)
      prisoner().contains('Smith, Norman')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      action().contains('View report')
    }

    {
      const { action, date, prisoner } = yourReportsPage.reports(0)
      prisoner().contains('Smith, Norman')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      action().contains('Continue')
      action().click()

      const inProgressReport = ReportUseOfForcePage.verifyOnPage()

      inProgressReport.checkParts({
        newIncident: 'COMPLETE',
        details: 'NOT_STARTED',
        relocationAndInjuries: 'NOT_STARTED',
        evidence: 'NOT_STARTED',
      })
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
            userId: 'TEST_USER',
            name: 'TEST_USER name',
            email: 'TEST_USER@gov.uk',
          },
        ],
      }))
    )

    const yourReportsPage = YourReportsPage.goTo()
    yourReportsPage.selectedTab().contains('Your reports')
    yourReportsPage.pagination().should('be.visible')

    yourReportsPage.pageResults().should(results => expect(results.text()).to.contain('Showing 1 to 20 of 62 results'))

    yourReportsPage.pageLinks().then(pageLinks =>
      expect(pageLinks).to.deep.equal([
        { href: undefined, text: '1', selected: true },
        { href: '?page=2', text: '2', selected: false },
        { href: '?page=3', text: '3', selected: false },
        { href: '?page=4', text: '4', selected: false },
        { href: '?page=2', text: 'Next set of pages', selected: false },
      ])
    )
    yourReportsPage.clickLinkWithText('Next set of pages')
    yourReportsPage.pageLinks().then(pageLinks =>
      expect(pageLinks).to.deep.equal([
        { href: '?page=1', text: 'Previous set of pages', selected: false },
        { href: '?page=1', text: '1', selected: false },
        { href: undefined, text: '2', selected: true },
        { href: '?page=3', text: '3', selected: false },
        { href: '?page=4', text: '4', selected: false },
        { href: '?page=3', text: 'Next set of pages', selected: false },
      ])
    )

    yourReportsPage.clickLinkWithText('4')
    yourReportsPage.pageLinks().then(pageLinks =>
      expect(pageLinks).to.deep.equal([
        { href: '?page=3', text: 'Previous set of pages', selected: false },
        { href: '?page=1', text: '1', selected: false },
        { href: '?page=2', text: '2', selected: false },
        { href: '?page=3', text: '3', selected: false },
        { href: undefined, text: '4', selected: true },
      ])
    )

    yourReportsPage.clickLinkWithText('Previous set of pages')
    yourReportsPage.pageLinks().then(pageLinks =>
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
})
