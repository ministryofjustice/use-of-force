const moment = require('moment')
const RequestRemovalPage = require('../../pages/yourStatements/requestRemovalPage')
const { ReportStatus } = require('../../../dist/server/config/types')

context('Request removal', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubClientCredentialsToken')
    cy.task('stubPrison', 'MDI')
  })

  const seedReport = () =>
    cy
      .task('seedReport', {
        status: ReportStatus.SUBMITTED,
        incidentDate: moment('2019-01-22 09:57:40.000'),
        agencyId: 'MDI',
        involvedStaff: [
          { name: 'Emily Jones', email: 'Emily@gov.uk', staffId: 5, username: 'EMILY_JONES', verified: true },
        ],
      })
      .then(result => result.EMILY_JONES)

  it('A user can submit their statement removal request', () => {
    seedReport().then(statementId => {
      const requestRemovalPage = RequestRemovalPage.visit(statementId)
      requestRemovalPage.incidentDate().contains('22 January 2019')
      requestRemovalPage.incidentTime().contains('09:57')
      requestRemovalPage.prisonName().contains('Moorland')
      requestRemovalPage.reason().type('This is my reason to be removed')
      requestRemovalPage.requestToBeRemoved().click()
    })
  })
})
