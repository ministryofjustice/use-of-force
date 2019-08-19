const SubmittedPage = require('../../pages/submittedPage')
const ViewStatementPage = require('../../pages/viewStatementPage')
const { createReport, stubExternalApis } = require('./helper')

context('Submit statement', () => {
  beforeEach(() => {
    stubExternalApis()
  })

  it('Can view a submitted report', () => {
    createReport()

    const submittedPage = SubmittedPage.verifyOnPage()

    const submitStatementPage = submittedPage.continueToStatement()
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const confirmStatementPage = submitStatementPage.submit()
    confirmStatementPage.offenderName().should('contain', 'Norman Smith')
    confirmStatementPage.statement().should('contain', 'This is my statement')
    confirmStatementPage.lastTraining().should('contain', 'March 2010')
    confirmStatementPage.jobStartYear().should('contain', '1999')
    confirmStatementPage.confirm().click()

    const statementSubmittedPage = confirmStatementPage.submit()

    const incidentsPage = statementSubmittedPage.finish()

    const { viewButton } = incidentsPage.getCompleteRow(0)

    viewButton().click()

    const viewStatementPage = ViewStatementPage.verifyOnPage()
    viewStatementPage.offenderName().should('contain', 'Norman Smith')
    viewStatementPage.statement().should('contain', 'This is my statement')
    viewStatementPage.lastTraining().should('contain', 'March 2010')
    viewStatementPage.jobStartYear().should('contain', '1999')
  })
})
