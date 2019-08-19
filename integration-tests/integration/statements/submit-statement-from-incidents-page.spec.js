const IncidentsPage = require('../../pages/incidentsPage')
const SubmitStatementPage = require('../../pages/submitStatementPage')
const { createReport, stubExternalApis } = require('./helper')

context('Submit statement', () => {
  beforeEach(() => {
    stubExternalApis()
  })

  it('A user can submit their statement from the incidents page', () => {
    createReport()

    {
      const incidentsPage = IncidentsPage.goTo()
      const { date, prisoner, reporter, startButton } = incidentsPage.getTodoRow(0)
      prisoner().should('contain', 'Norman Smith')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/))

      startButton().click()
    }

    const submitStatementPage = SubmitStatementPage.verifyOnPage()
    submitStatementPage.offenderName().contains('Norman Smith (A1234AC)')
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const confirmStatementPage = submitStatementPage.submit()
    confirmStatementPage.confirm().click()

    const statementSubmittedPage = confirmStatementPage.submit()

    {
      const incidentsPage = statementSubmittedPage.finish()
      const { date, prisoner, reporter } = incidentsPage.getCompleteRow(0)
      prisoner().should('contain', 'Norman Smith')
      reporter().should('contain', 'James Stuart')
      date().should(elem => expect(elem.text()).to.match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/))
    }
  })
})
