const SubmittedPage = require('../../pages/submittedPage')
const { StatementStatus } = require('../../../server/config/types')
const { createReport, stubExternalApis } = require('./helper')

context('Submit statement', () => {
  beforeEach(() => {
    stubExternalApis()
  })

  it('A user can submit their own statement after submitting report', () => {
    createReport()

    const submittedPage = SubmittedPage.verifyOnPage()

    const submitStatementPage = submittedPage.continueToStatement()
    submitStatementPage.lastTrainingMonth().select('March')
    submitStatementPage.lastTrainingYear().type('2010')
    submitStatementPage.jobStartYear().type('1999')
    submitStatementPage.statement().type('This is my statement')

    const confirmStatementPage = submitStatementPage.submit()
    confirmStatementPage.confirm().click()

    const statementSubmittedPage = confirmStatementPage.submit()

    const incidentsPage = statementSubmittedPage.finish()

    const { date, prisoner, reporter, incidentId } = incidentsPage.getCompleteRow(0)
    prisoner().should('contain', 'Norman Smith')
    reporter().should('contain', 'James Stuart')
    date().should(elem => expect(elem.text()).to.match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/))

    incidentId().then(id =>
      cy.task('getStatement', { incidentId: id, status: StatementStatus.SUBMITTED }).then(statement => {
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
})
