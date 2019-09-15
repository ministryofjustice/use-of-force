const IncidentsPage = require('../../pages/incidentsPage')
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

  it('After a reviewer completes the final statement, the report is marked as complete', () => {
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

    const incidentsPage = IncidentsPage.goTo()

    incidentsPage
      .allTabs()
      .then(allTabs => expect(allTabs).to.deep.equal(['All incidents', 'Your statements', 'Your reports']))

    incidentsPage.selectedTab().contains('All incidents')

    const allIncidentsPage = AllIncidentsPage.verifyOnPage()

    {
      const { date, prisoner, reporter } = allIncidentsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }
  })
})
