const TasklistPage = require('../../pages/tasklistPage')
const IncidentsPage = require('../../pages/incidentsPage')
const SubmittedPage = require('../../pages/submittedPage')
const SubmitStatementPage = require('../../pages/submitStatementPage')
const ViewStatementPage = require('../../pages/viewStatementPage')
const { StatementStatus, ReportStatus } = require('../../../server/config/types')

context('Submit statement', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
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

    {
      const incidentsPage = IncidentsPage.goTo()
      const { date, prisoner, reporter, startButton } = incidentsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))

      startButton().click()
    }

    const submitStatementPage = SubmitStatementPage.verifyOnPage()
    submitStatementPage.offenderName().contains('Norman Smith (A1234AC)')
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const confirmStatementPage = submitStatementPage.submit()
    const statementSubmittedPage = confirmStatementPage.submit()

    {
      const incidentsPage = statementSubmittedPage.finish()
      const { date, prisoner, reporter } = incidentsPage.getCompleteRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }
  })

  it('A user can submit their own statement after submitting report', () => {
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    const tasklistPage = TasklistPage.visit(bookingId)
    const checkAnswersPage = tasklistPage.goToAnswerPage()

    checkAnswersPage.clickSubmit()

    const submittedPage = SubmittedPage.verifyOnPage()

    const submitStatementPage = submittedPage.continueToStatement()
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const confirmStatementPage = submitStatementPage.submit()

    const statementSubmittedPage = confirmStatementPage.submit()

    const incidentsPage = statementSubmittedPage.finish()

    const { date, prisoner, reporter, reportId } = incidentsPage.getCompleteRow(0)
    prisoner().should('contain', 'Smith, Norman')
    reporter().should('contain', 'James Stuart')
    date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))

    reportId().then(id =>
      cy.task('getStatementForUser', { reportId: id, status: StatementStatus.SUBMITTED }).then(statement => {
        const { id: _, incidentDate, submittedDate, ...vals } = statement

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

  it('Can view a submitted statement', () => {
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

    let incidentsPage = IncidentsPage.goTo()
    incidentsPage
      .getTodoRow(0)
      .startButton()
      .click()

    const submitStatementPage = SubmitStatementPage.verifyOnPage()
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const confirmStatementPage = submitStatementPage.submit()
    confirmStatementPage.offenderName().should('contain', 'Norman Smith')
    confirmStatementPage.statement().should('contain', 'This is my statement')
    confirmStatementPage.lastTraining().should('contain', 'March 2010')
    confirmStatementPage.jobStartYear().should('contain', '1999')

    const statementSubmittedPage = confirmStatementPage.submit()

    incidentsPage = statementSubmittedPage.finish()

    incidentsPage
      .getCompleteRow(0)
      .viewButton()
      .click()

    const viewStatementPage = ViewStatementPage.verifyOnPage()
    viewStatementPage.offenderName().should('contain', 'Norman Smith')
    viewStatementPage.statement().should('contain', 'This is my statement')
    viewStatementPage.lastTraining().should('contain', 'March 2010')
    viewStatementPage.jobStartYear().should('contain', '1999')
  })
})
