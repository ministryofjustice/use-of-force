const TasklistPage = require('../../pages/tasklistPage')
const YourStatementsPage = require('../../pages/yourStatementsPage')
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
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  it('A user can submit their statement from incidents page', () => {
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

    {
      const yourStatementsPage = YourStatementsPage.goTo()
      const { date, prisoner, reporter, startButton } = yourStatementsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      startButton().should('contain.text', 'Start statement')
      startButton().click()
    }

    let submitStatementPage = SubmitStatementPage.verifyOnPage()
    submitStatementPage.offenderName().contains('Norman Smith')
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')
    submitStatementPage.saveAndExit().click()

    {
      const yourStatementsPage = YourStatementsPage.goTo()
      const { date, prisoner, reporter, startButton } = yourStatementsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      startButton().should('contain.text', 'Continue statement')
      startButton().click()
    }

    submitStatementPage = SubmitStatementPage.verifyOnPage()
    submitStatementPage.offenderName().contains('Norman Smith')
    submitStatementPage.lastTrainingMonth().contains('March')
    submitStatementPage.lastTrainingYear().should('have.value', '2010')
    submitStatementPage.jobStartYear().should('have.value', '1999')
    submitStatementPage.statement().should('have.value', 'This is my statement')

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
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    let yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage
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

    yourStatementsPage = statementSubmittedPage.finish()

    yourStatementsPage
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
