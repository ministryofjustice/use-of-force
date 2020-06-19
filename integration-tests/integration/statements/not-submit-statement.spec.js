const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const WriteYourStatementPage = require('../../pages/yourStatements/writeYourStatementPage')
const { ReportStatus } = require('../../../server/config/types')
const CheckYourStatementPage = require('../../pages/yourStatements/checkYourStatementPage')

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

  it('A user can leave the submission for another time', () => {
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
      const { startButton } = yourStatementsPage.getTodoRow(0)
      startButton().click()
    }
    const writeYourStatementPage = WriteYourStatementPage.verifyOnPage()
    writeYourStatementPage.offenderName().contains('Norman Smith')
    writeYourStatementPage.lastTrainingMonth().select('March')
    writeYourStatementPage.lastTrainingYear().type('2010')
    writeYourStatementPage.jobStartYear().type('1999')
    writeYourStatementPage.statement().type('This is my statement')
    writeYourStatementPage.submit()
    const checkYourStatementPage = CheckYourStatementPage.verifyOnPage()
    checkYourStatementPage.completeLater()
    YourStatementsPage.verifyOnPage()
  })
})
