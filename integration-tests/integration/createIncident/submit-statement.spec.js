const TasklistPage = require('../../pages/tasklistPage')
const IncidentsPage = require('../../pages/incidentsPage')
const SubmittedPage = require('../../pages/submittedPage')
const SubmitStatementPage = require('../../pages/submitStatementPage')

context('Submit the incident report', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
  })

  it('A user can submit their statement from incidents page', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()

    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage
      .staffInvolved(0)
      .name()
      .type('Test User')

    const detailsPage = newIncidentPage.save()
    const relocationAndInjuriesPage = detailsPage.save()
    const evidencePage = relocationAndInjuriesPage.save()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.confirm()
    checkAnswersPage.clickSubmit()

    {
      const incidentsPage = IncidentsPage.goTo()
      const { date, prisoner, reporter, startButton } = incidentsPage.getTodoRow(0)
      prisoner().should('contain', 'Norman Smith')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/))

      startButton().click()
    }

    const submitStatementPage = SubmitStatementPage.verifyOnPage()
    submitStatementPage.offenderName().contains('Norman Smith (A1234AC)')
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const statementSubmittedPage = submitStatementPage.submit()

    {
      const incidentsPage = statementSubmittedPage.finish()
      const { date, prisoner, reporter } = incidentsPage.getCompleteRow(0)
      prisoner().should('contain', 'Norman Smith')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/))
    }
  })

  it('A user can submit their own statement after submitting report', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()

    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage
      .staffInvolved(0)
      .name()
      .type('Test User')

    const detailsPage = newIncidentPage.save()
    const relocationAndInjuriesPage = detailsPage.save()
    const evidencePage = relocationAndInjuriesPage.save()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.confirm()
    checkAnswersPage.clickSubmit()

    const submittedPage = SubmittedPage.verifyOnPage()

    const submitStatementPage = submittedPage.continueToStatement()
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const statementSubmittedPage = submitStatementPage.submit()
    const incidentsPage = statementSubmittedPage.finish()

    const { date, prisoner, reporter, incidentId } = incidentsPage.getCompleteRow(0)
    prisoner().should('contain', 'Norman Smith')
    reporter().should('contain', 'James Stuart')
    date().should(elem => expect(elem.text()).to.match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/))

    incidentId().then(id =>
      cy.task('getStatement', id).then(statement => {
        const { id: _, incidentDate, ...vals } = statement

        expect(vals).to.deep.equal({
          bookingId: '1001',
          lastTrainingMonth: 2,
          lastTrainingYear: 2010,
          jobStartYear: 1999,
          statement: 'This is my statement',
        })
      })
    )
  })
})
