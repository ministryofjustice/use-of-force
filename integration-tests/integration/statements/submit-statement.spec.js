const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const SubmittedPage = require('../../pages/createReport/reportSentPage')
const WriteYourStatementPage = require('../../pages/yourStatements/writeYourStatementPage')
const YourStatementPage = require('../../pages/yourStatements/yourStatementPage')
const { StatementStatus, ReportStatus } = require('../../../server/config/types')

context('Submit statement', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubPrison', 'MDI')
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
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      startButton().should('contain.text', 'Start statement')
      startButton().click()
    }

    let writeYourStatementPage = WriteYourStatementPage.verifyOnPage()
    writeYourStatementPage.offenderName().contains('Norman Smith')
    writeYourStatementPage.lastTrainingMonth().select('March')
    writeYourStatementPage.lastTrainingYear().type('2010')
    writeYourStatementPage.jobStartYear().type('1999')
    writeYourStatementPage.statement().type('This is my statement')
    writeYourStatementPage.saveAndExit().click()

    {
      const yourStatementsPage = YourStatementsPage.goTo()
      const { date, prisoner, reporter, startButton } = yourStatementsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      startButton().should('contain.text', 'Continue statement')
      startButton().click()
    }

    writeYourStatementPage = WriteYourStatementPage.verifyOnPage()
    writeYourStatementPage.offenderName().contains('Norman Smith')
    writeYourStatementPage.lastTrainingMonth().contains('March')
    writeYourStatementPage.lastTrainingYear().should('have.value', '2010')
    writeYourStatementPage.jobStartYear().should('have.value', '1999')
    writeYourStatementPage.statement().should('have.value', 'This is my statement')

    const checkYourStatementPage = writeYourStatementPage.submit()
    const statementSubmittedPage = checkYourStatementPage.submit()

    {
      const incidentsPage = statementSubmittedPage.finish()
      const { date, prisoner, reporter } = incidentsPage.getCompleteRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }
  })

  it('A user can submit their own statement after submitting report', () => {
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    checkAnswersPage.clickSubmit()

    const submittedPage = SubmittedPage.verifyOnPage()

    const writeYourStatementPage = submittedPage.continueToStatement()
    writeYourStatementPage.lastTrainingMonth().select('March')
    writeYourStatementPage.lastTrainingYear().type('2010')
    writeYourStatementPage.jobStartYear().type('1999')
    writeYourStatementPage.statement().type('This is my statement')

    const checkYourStatementPage = writeYourStatementPage.submit()

    const statementSubmittedPage = checkYourStatementPage.submit()

    const incidentsPage = statementSubmittedPage.finish()

    const { date, prisoner, reporter, reportId } = incidentsPage.getCompleteRow(0)
    prisoner().contains('Smith, Norman')
    reporter().contains('James Stuart')
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

    const writeYourStatementPage = WriteYourStatementPage.verifyOnPage()
    writeYourStatementPage.lastTrainingMonth().select('March')
    writeYourStatementPage.lastTrainingYear().type('2010')
    writeYourStatementPage.jobStartYear().type('1999')
    writeYourStatementPage.statement().type('This is my statement')

    const checkYourStatementPage = writeYourStatementPage.submit()
    checkYourStatementPage.offenderName().contains('Norman Smith')
    checkYourStatementPage.statement().contains('This is my statement')
    checkYourStatementPage.lastTraining().contains('March 2010')
    checkYourStatementPage.jobStartYear().contains('1999')

    const statementSubmittedPage = checkYourStatementPage.submit()

    yourStatementsPage = statementSubmittedPage.finish()

    yourStatementsPage
      .getCompleteRow(0)
      .viewButton()
      .click()

    const yourStatementPage = YourStatementPage.verifyOnPage()
    yourStatementPage.offenderName().contains('Norman Smith')
    yourStatementPage.statement().contains('This is my statement')
    yourStatementPage.lastTraining().contains('March 2010')
    yourStatementPage.jobStartYear().contains('1999')
  })
})
