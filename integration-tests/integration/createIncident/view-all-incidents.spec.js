const YourStatementsPage = require('../../pages/yourStatementsPage')
const AllIncidentsPage = require('../../pages/allIncidentsPage')

const { ReportStatus } = require('../../../server/config/types')

context('All incidents page', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS JONES')
    cy.task('stubUserDetailsRetrieval', 'Test User')
  })

  it('A reviewer can view all incidents', () => {
    cy.task('stubReviewerLogin')
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      involvedStaff: [
        {
          userId: 'Test User',
          name: 'Test User name',
          email: 'Test User@gov.uk',
        },
      ],
    })

    const allIncidentsPage = AllIncidentsPage.goTo()

    allIncidentsPage
      .allTabs()
      .then(allTabs => expect(allTabs).to.deep.equal(['All incidents', 'Your statements', 'Your reports']))

    allIncidentsPage.selectedTab().contains('All incidents')

    {
      const { date, prisoner, reporter } = allIncidentsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
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
