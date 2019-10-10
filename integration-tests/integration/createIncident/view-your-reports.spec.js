const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const YourReportsPage = require('../../pages/yourReports/yourReportsPage')
const { ReportStatus } = require('../../../server/config/types')

context('A reporter views their report list', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR_ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS_JONES')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  it('A user can view all of their reports', () => {
    cy.login(bookingId)

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

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
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
      const { date, prisoner } = yourReportsPage.getCompleteRow(0)
      prisoner().should('contain', 'Smith, Norman')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }

    {
      const { startButton, date, prisoner } = yourReportsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))

      startButton().click()

      const inProgressReport = ReportUseOfForcePage.verifyOnPage()

      inProgressReport.checkParts({
        newIncident: 'COMPLETE',
        details: 'NOT_STARTED',
        relocationAndInjuries: 'NOT_STARTED',
        evidence: 'NOT_STARTED',
      })
    }
  })
})
