const TasklistPage = require('../../pages/tasklistPage')
const SubmittedPage = require('../../pages/submittedPage')
const ViewStatementPage = require('../../pages/viewStatementPage')
const IncidentsPage = require('../../pages/incidentsPage')
const ViewAddCommentPage = require('../../pages/addAdditionalCommentPage')

context('Add comments to statement', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubOffenders')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'MR ZAGATO')
    cy.task('stubUserDetailsRetrieval', 'MRS JONES')
    cy.task('stubUserDetailsRetrieval', 'Test User')
  })

  it('A user can select a specific statement, add to it and then return back to statements page', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    tasklistPage.checkNoPartsComplete()

    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.fillForm()

    const detailsPage = newIncidentPage.save()
    detailsPage.fillForm()

    const relocationAndInjuriesPage = detailsPage.save()
    relocationAndInjuriesPage.fillForm()

    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.fillForm()

    const checkAnswersPage = evidencePage.save()
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
    const { viewButton } = incidentsPage.getCompleteRow(0)
    viewButton().click()

    let pageComponent = ViewStatementPage.verifyOnPage()
    pageComponent.addComment().click()

    pageComponent = ViewAddCommentPage.verifyOnPage()
    pageComponent.additionalComment().should('be.empty')
    pageComponent.additionalComment().type('Some new comment 1')
    pageComponent.save().click()

    pageComponent = IncidentsPage.verifyOnPage()
    pageComponent.viewStatement().click()

    pageComponent = ViewStatementPage.verifyOnPage()
    pageComponent.addComment().click()

    pageComponent = ViewAddCommentPage.verifyOnPage()
    pageComponent.viewAdditionalComment(1).should('contain', 'Some new comment 1')
    pageComponent.additionalComment().should('be.empty')
    pageComponent.additionalComment(2).type('Some new comment 2')
    pageComponent.save().click()

    pageComponent = IncidentsPage.verifyOnPage()
    pageComponent.viewStatement().click()

    pageComponent = ViewStatementPage.verifyOnPage()
    pageComponent.viewAdditionalComment(1).should('contain', 'Some new comment 1')
    pageComponent.viewAdditionalComment(2).should('contain', 'Some new comment 2')
    pageComponent.continue().click()

    IncidentsPage.verifyOnPage()
  })
})
