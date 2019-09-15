const YourStatementsPage = require('../../pages/yourStatementsPage')
const AllIncidentsPage = require('../../pages/allIncidentsPage')
const SubmittedStatementPage = require('../../pages/submitStatementPage')

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

  it('After the final statement is completed, the reviewer can see that the report is marked as complete', () => {
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

    cy.visit('/')
    let allIncidentsPage = AllIncidentsPage.verifyOnPage()

    allIncidentsPage.getTodoRows().should('have.length', 1)
    allIncidentsPage.getCompleteRows().should('have.length', 0)

    {
      const { date, prisoner, reporter } = allIncidentsPage.getTodoRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }

    allIncidentsPage.yourStatementsTab().click()

    let yourStatementsPage = YourStatementsPage.verifyOnPage()
    yourStatementsPage
      .getTodoRow(0)
      .startButton()
      .click()

    const submitStatementPage = SubmittedStatementPage.verifyOnPage()
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const confirmStatementPage = submitStatementPage.submit()
    const statementSubmittedPage = confirmStatementPage.submit()
    statementSubmittedPage.finish()

    yourStatementsPage = YourStatementsPage.verifyOnPage()
    yourStatementsPage.allIncidentsTab().click()

    allIncidentsPage = AllIncidentsPage.verifyOnPage()

    allIncidentsPage.getTodoRows().should('have.length', 0)
    allIncidentsPage.getCompleteRows().should('have.length', 1)

    {
      const { date, prisoner, reporter } = allIncidentsPage.getCompleteRow(0)
      prisoner().should('contain', 'Smith, Norman')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
    }
  })
})
