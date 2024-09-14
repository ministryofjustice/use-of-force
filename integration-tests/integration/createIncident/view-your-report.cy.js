const { offender } = require('../../mockApis/data')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const YourReportPage = require('../../pages/yourReports/yourReportPage')
const YourReportsPage = require('../../pages/yourReports/yourReportsPage')
const { ReportStatus } = require('../../../server/config/types')
const { expectedPayload } = require('../seedData')

context('A reporter views their own report', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('A user can view their own report', () => {
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')

    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: '2019-09-04 11:27:52',
      involvedStaff: [
        {
          username: 'MR_ZAGATO',
          name: 'MR_ZAGATO name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          username: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.selectedTab().contains('Your statements')
    yourStatementsPage.yourReportsTab().click()

    const yourReportsPage = YourReportsPage.verifyOnPage()
    yourReportsPage.selectedTab().contains('Your reports')

    yourReportsPage.reports(0).action().click()

    const yourReportPage = YourReportPage.verifyOnPage()
    yourReportPage.reporterName().contains('James Stuart')
    yourReportPage.prisonerName().contains('Norman Smith')
    yourReportPage.prisonNumber().contains('A1234AC')
    yourReportPage.submittedDate().contains(/4 September 2019, \d{2}:\d{2}/)
    yourReportPage.getReportId().then(reportId => {
      yourReportPage.incidentNumber().contains(reportId)
    })
    yourReportPage.verifyInputs()

    yourReportPage.returnToYourReports().click()

    YourReportsPage.verifyOnPage()
  })

  it('A user can view their own report when no authorisedBy field', () => {
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')

    cy.login()

    const payload = { ...expectedPayload }
    payload.incidentDetails.plannedUseOfForce = true
    payload.incidentDetails.authorisedBy = undefined

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: '2019-09-04 11:27:52',
      payload,
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.selectedTab().contains('Your statements')
    yourStatementsPage.yourReportsTab().click()

    const yourReportsPage = YourReportsPage.verifyOnPage()
    yourReportsPage.selectedTab().contains('Your reports')

    yourReportsPage.reports(0).action().click()
    const yourReportPage = YourReportPage.verifyOnPage()

    yourReportPage.useOfForcePlanned().contains('Yes')
    yourReportPage.authorisedBy().should('not.exist')

    yourReportPage.returnToYourReports().click()
    YourReportsPage.verifyOnPage()
  })

  it('A user can view their own report when location is not found', () => {
    cy.task('stubLocationNotFound', '00000000-1111-2222-3333-444444444444')

    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: '2019-09-04 11:27:52',
      involvedStaff: [
        {
          username: 'MR_ZAGATO',
          name: 'MR_ZAGATO name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          username: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.yourReportsTab().click()

    const yourReportsPage = YourReportsPage.verifyOnPage()
    yourReportsPage.reports(0).action().click()

    const yourReportPage = YourReportPage.verifyOnPage()
    yourReportPage.location().contains('–')
    yourReportPage.batonDrawnAgainstPrisonerLabel().contains('Was a baton drawn by anyone against this prisoner?')
    yourReportPage.pavaDrawnAgainstPrisonerLabel().contains('Was PAVA drawn by anyone against this prisoner?')
  })

  it('A user can view reports and it will show the old version of the Baton and PAVA questions', () => {
    cy.task('stubLocationNotFound', '00000000-1111-2222-3333-444444444444')

    cy.login()

    expectedPayload.useOfForceDetails.batonDrawnAgainstPrisoner = undefined
    expectedPayload.useOfForceDetails.pavaDrawnAgainstPrisoner = undefined
    expectedPayload.useOfForceDetails.batonDrawn = true
    expectedPayload.useOfForceDetails.pavaDrawn = true

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: '2019-09-04 11:27:52',
      involvedStaff: [
        {
          username: 'MR_ZAGATO',
          name: 'MR_ZAGATO name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          username: 'MRS_JONES',
          name: 'MRS_JONES name',
          email: 'MR_ZAGATO@gov.uk',
        },
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
      payload: expectedPayload,
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.yourReportsTab().click()

    const yourReportsPage = YourReportsPage.verifyOnPage()
    yourReportsPage.reports(0).action().click()

    const yourReportPage = YourReportPage.verifyOnPage()

    yourReportPage.batonDrawnLabel().contains('Was a baton drawn by anyone during this incident?')
    yourReportPage.pavaDrawnLabel().contains('Was PAVA drawn by anyone during this incident?')
  })
})
