const { offender } = require('../../mockApis/data')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const SearchForPrisonerPage = require('../../pages/createReport/searchForPrisonerPage')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')

context('Creating reports for prisoners in other prisons', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderImage', offender.bookingId)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubPrisons')
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER', 'ANOTHER_USER'])
  })

  it('A user can create a report for a prisoner in another prison using prison number', () => {
    cy.login()

    cy.task('stubSearch', {
      query: {
        equalToJson: {
          prisonerIdentifier: 'A1234AC',
          includeAliases: false,
        },
      },
      results: [
        {
          firstName: 'NORMAN',
          lastName: 'SMITH',
          bookingId: 1001,
          prisonerNumber: 'A1234AC',
          prisonId: 'MDI',
        },
      ],
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.reportInAnotherPrisonLink().click()
    const searchForPrisoner = SearchForPrisonerPage.verifyOnPage()
    searchForPrisoner.prisonerNumber().type('A1234AC')

    searchForPrisoner.clickSearch()

    searchForPrisoner.resultCount().contains('1')

    searchForPrisoner.results().then(rows => {
      expect(rows.length).equal(1)
      const { link, ...rest } = rows[0]
      expect(rest).to.deep.equal({ name: 'Smith, Norman', prisonNumber: 'A1234AC', currentPrison: 'HMP Moorland' })
      link.click()
    })

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    reportUseOfForcePage.bannerOffenderName().contains('Smith, Norman')
    reportUseOfForcePage.dob().contains('26/12/2000')
    reportUseOfForcePage.nomisId().contains('A1234AC')
    reportUseOfForcePage.offenderImage().should('be.visible')
  })

  it('A user can create a report for a prisoner in another prison using last name', () => {
    cy.login()

    cy.task('stubSearch', {
      query: {
        equalToJson: {
          lastName: 'Smith',
          prisonId: 'MDI',
          includeAliases: false,
        },
      },
      results: [
        {
          firstName: 'JIM',
          lastName: 'SMITH',
          bookingId: 1002,
          prisonerNumber: 'A1234ZZ',
          prisonId: 'MDI',
        },
        {
          firstName: 'NORMAN',
          lastName: 'SMITH',
          bookingId: 1001,
          prisonerNumber: 'A1234AC',
          prisonId: 'MDI',
        },
      ],
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.reportInAnotherPrisonLink().click()
    const searchForPrisoner = SearchForPrisonerPage.verifyOnPage()
    searchForPrisoner.otherDetails().click()
    searchForPrisoner.lastName().type('Smith')
    searchForPrisoner.prison().select('MDI')

    searchForPrisoner.clickSearch()

    searchForPrisoner.resultCount().contains('2')

    searchForPrisoner.results().then(rows => {
      expect(rows.length).equal(2)
      {
        const { link, ...rest } = rows[0]
        expect(rest).to.deep.equal({ name: 'Smith, Jim', prisonNumber: 'A1234ZZ', currentPrison: 'HMP Moorland' })
      }
      {
        const { link, ...rest } = rows[1]
        expect(rest).to.deep.equal({ name: 'Smith, Norman', prisonNumber: 'A1234AC', currentPrison: 'HMP Moorland' })
        link.click()
      }
    })

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    reportUseOfForcePage.bannerOffenderName().contains('Smith, Norman')
    reportUseOfForcePage.dob().contains('26/12/2000')
    reportUseOfForcePage.nomisId().contains('A1234AC')
    reportUseOfForcePage.offenderImage().should('be.visible')
  })
})
