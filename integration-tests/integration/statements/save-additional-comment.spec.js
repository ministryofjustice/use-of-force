const WriteYourStatementPage = require('../../pages/yourStatements/writeYourStatementPage')
const YourStatementPage = require('../../pages/yourStatements/yourStatementPage')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const AddCommentToStatementPage = require('../../pages/yourStatements/addCommentToStatementPage')
const { ReportStatus } = require('../../../server/config/types')

context('Add comments to statement', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
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
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
  })

  it('A user can select a specific statement, add to it and then return back to statements page', () => {
    cy.login(bookingId)

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
    const statementSubmittedPage = checkYourStatementPage.submit()
    yourStatementsPage = statementSubmittedPage.finish()
    yourStatementsPage
      .getCompleteRow(0)
      .viewButton()
      .click()

    let yourStatementPage = YourStatementPage.verifyOnPage()
    yourStatementPage.addComment().click()

    let addCommentToStatementPage = AddCommentToStatementPage.verifyOnPage()
    addCommentToStatementPage.additionalComment().should('be.empty')
    addCommentToStatementPage.additionalComment().type('Some new comment 1')
    addCommentToStatementPage.save().click()

    yourStatementsPage = YourStatementsPage.verifyOnPage()
    yourStatementsPage
      .getCompleteRow(0)
      .viewButton()
      .click()

    yourStatementPage = YourStatementPage.verifyOnPage()
    yourStatementPage.addComment().click()

    addCommentToStatementPage = AddCommentToStatementPage.verifyOnPage()
    addCommentToStatementPage.viewAdditionalComment(1).contains('Some new comment 1')
    addCommentToStatementPage.additionalComment().should('be.empty')
    addCommentToStatementPage.additionalComment(2).type('Some new comment 2')
    addCommentToStatementPage.save().click()

    yourStatementsPage = YourStatementsPage.verifyOnPage()
    yourStatementsPage
      .getCompleteRow(0)
      .viewButton()
      .click()

    yourStatementPage = YourStatementPage.verifyOnPage()
    yourStatementPage.viewAdditionalComment(1).contains('Some new comment 1')
    yourStatementPage.viewAdditionalComment(2).contains('Some new comment 2')
    yourStatementPage.continue().click()

    YourStatementsPage.verifyOnPage()
  })
})
