const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const SearchForPrisonerPage = require('../../pages/createReport/searchForPrisonerPage')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')

context('Creating reports for prisoners in other prisons', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubPrisons')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  it('A user can create a report for a prisoner in another prison using prison number', () => {
    cy.login(bookingId)

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

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    reportUseOfForcePage.offenderName().contains('Norman Smith')
    reportUseOfForcePage.dob().contains('26 December 2000')
    reportUseOfForcePage.nomisId().contains('A1234AC')
    reportUseOfForcePage.offenderImage().should('be.visible')
  })

  it('A user can create a report for a prisoner in another prison using last name', () => {
    cy.login(bookingId)

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

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    reportUseOfForcePage.offenderName().contains('Norman Smith')
    reportUseOfForcePage.dob().contains('26 December 2000')
    reportUseOfForcePage.nomisId().contains('A1234AC')
    reportUseOfForcePage.offenderImage().should('be.visible')
  })
})
