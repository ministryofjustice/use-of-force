const moment = require('moment')
const { offender } = require('../../mockApis/data')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const WriteYourStatementPage = require('../../pages/yourStatements/writeYourStatementPage')
const CompletedIncidentsPage = require('../../pages/reviewer/completedIncidentsPage')
const NotCompletedIncidentsPage = require('../../pages/reviewer/notCompletedIncidentsPage')
const { ReportStatus } = require('../../../server/config/types')

context('Marking a report as complete', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderImage', offender.bookingId)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('After the final statement is completed, the reviewer can see that the report is marked as complete', () => {
    cy.task('stubReviewerLogin')
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      overdueDate: moment().subtract(1, 'd').toDate(),
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    cy.visit('/')
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.verifyOnPage()

    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)
    notCompletedIncidentsPage.getNoTodoRows().should('not.exist')

    {
      const { date, prisoner, prisonNumber, reporter } = notCompletedIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      date().should(elem => expect(elem.text()).to.match(/\d{2}[/]\d{2}[/]\d{4}/))
    }

    notCompletedIncidentsPage.yourStatementsTab().click()

    let yourStatementsPage = YourStatementsPage.verifyOnPage()
    yourStatementsPage.statements(0).overdue().should('exist')
    yourStatementsPage.statements(0).action().click()

    const writeYourStatementPage = WriteYourStatementPage.verifyOnPage()
    writeYourStatementPage.lastTrainingMonth().select('March')
    writeYourStatementPage.lastTrainingYear().type('2010')
    writeYourStatementPage.jobStartYear().type('1999')
    writeYourStatementPage.statement().type('This is my statement')

    const checkYourStatementPage = writeYourStatementPage.submit()
    const statementSubmittedPage = checkYourStatementPage.submit()
    statementSubmittedPage.finish()

    yourStatementsPage = YourStatementsPage.verifyOnPage()
    yourStatementsPage.statements(0).overdue().should('not.exist')

    yourStatementsPage.completedIncidentsTab().click()

    const completedIncidentsPage = CompletedIncidentsPage.verifyOnPage()

    completedIncidentsPage.getNoCompleteRows().should('not.exist')
    completedIncidentsPage.getCompleteRows().should('have.length', 1)

    {
      const { date, prisoner, prisonNumber, reporter } = completedIncidentsPage.getCompleteRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      date().should(elem => expect(elem.text()).to.match(/\d{2}[/]\d{2}[/]\d{4}/))
    }
  })
})
