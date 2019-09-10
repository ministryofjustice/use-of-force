const TasklistPage = require('../../pages/tasklistPage')
const IncidentsPage = require('../../pages/incidentsPage')
const MyReportsPage = require('../../pages/myReportsPage')
const { ReportStatus } = require('../../../server/config/types')

context('Submit statement', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS JONES')
    cy.task('stubUserDetailsRetrieval', 'Test User')
  })

  it('A user can submit their statement from incidents page', () => {
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

    const tasklistPage = TasklistPage.visit(bookingId)
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()
    newIncidentPage.save()

    const incidentsPage = IncidentsPage.goTo()
    incidentsPage.selectedTab().contains('My statements')
    incidentsPage.myReportsTab().click()
    incidentsPage.selectedTab().contains('My reports')

    const myReportsPage = MyReportsPage.verifyOnPage()

    {
      const { date, prisoner, reporter } = myReportsPage.getCompleteRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }

    {
      const { startButton, date, prisoner, reporter } = myReportsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))

      startButton().click()

      const inProgressReport = TasklistPage.verifyOnPage()

      inProgressReport.checkParts({
        newIncident: 'COMPLETE',
        details: 'NOT_STARTED',
        relocationAndInjuries: 'NOT_STARTED',
        evidence: 'NOT_STARTED',
      })
    }
  })
})
