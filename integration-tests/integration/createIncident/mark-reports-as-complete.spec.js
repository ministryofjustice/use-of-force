const { offender } = require('../../mockApis/data')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const AllIncidentsPage = require('../../pages/reviewer/allIncidentsPage')
const WriteYourStatementPage = require('../../pages/yourStatements/writeYourStatementPage')

const { ReportStatus } = require('../../../server/config/types')

context('Marking a report as complete', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('After the final statement is completed, the reviewer can see that the report is marked as complete', () => {
    cy.task('stubReviewerLogin')
    cy.login()

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

    cy.visit('/')
    let allIncidentsPage = AllIncidentsPage.verifyOnPage()

    allIncidentsPage.getTodoRows().should('have.length', 1)
    allIncidentsPage.getNoCompleteRows().should('exist')

    {
      const { date, prisoner, prisonNumber, reporter } = allIncidentsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }

    allIncidentsPage.yourStatementsTab().click()

    let yourStatementsPage = YourStatementsPage.verifyOnPage()
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
    yourStatementsPage.allIncidentsTab().click()

    allIncidentsPage = AllIncidentsPage.verifyOnPage()

    allIncidentsPage.getNoTodoRows().should('exist')
    allIncidentsPage.getCompleteRows().should('have.length', 1)

    {
      const { date, prisoner, prisonNumber, reporter } = allIncidentsPage.getCompleteRow(0)
      prisoner().contains('Smith, Norman')
      reporter().contains('James Stuart')
      prisonNumber().contains('A1234AC')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }
  })
})
