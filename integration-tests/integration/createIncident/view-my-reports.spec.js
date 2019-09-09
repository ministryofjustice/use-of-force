const TasklistPage = require('../../pages/tasklistPage')
const IncidentsPage = require('../../pages/incidentsPage')
const MyReportsPage = require('../../pages/myReportsPage')

context('Submit statement', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'Mr Zagato')
    cy.task('stubUserDetailsRetrieval', 'Mrs Jones')
    cy.task('stubUserDetailsRetrieval', 'Test User')
  })

  it('A user can submit their statement from incidents page', () => {
    cy.login(bookingId)

    let tasklistPage = TasklistPage.visit(bookingId)
    let newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()
    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()
    const relocationAndInjuriesPage = detailsPage.save()
    relocationAndInjuriesPage.fillForm()
    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.fillForm()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.clickSubmit()

    tasklistPage = TasklistPage.visit(bookingId)
    newIncidentPage = tasklistPage.startNewForm()
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
