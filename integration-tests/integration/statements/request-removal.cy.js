const moment = require('moment')
const RequestRemovalPage = require('../../pages/yourStatements/requestRemovalPage')
const RemovalRequestedPage = require('../../pages/yourStatements/removalRequestedPage')
const AlreadyRemovedPage = require('../../pages/yourStatements/alreadyRemovedPage')
const RemovalAlreadyRequestedPage = require('../../pages/yourStatements/removalAlreadyRequestedPage')

const { ReportStatus } = require('../../../dist/server/config/types')

context('Request removal', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
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
          {
            name: 'Emily Jones',
            email: 'Emily@gov.uk',
            staffId: 5,
            username: 'EMILY_JONES',
            verified: true,
          },
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

      RemovalRequestedPage.verifyOnPage()
    })
  })

  it('A user will be shown a validation message when no reason is provided', () => {
    seedReport().then(statementId => {
      const requestRemovalPage = RequestRemovalPage.visit(statementId)
      requestRemovalPage.incidentDate().contains('22 January 2019')
      requestRemovalPage.incidentTime().contains('09:57')
      requestRemovalPage.prisonName().contains('Moorland')
      requestRemovalPage.reason().should('be.empty')
      requestRemovalPage.requestToBeRemoved().click()

      requestRemovalPage.errorSummaryTitle().contains('There is a problem')
      requestRemovalPage.errorSummaryBody().contains('Enter why you should be removed from this incident')
      requestRemovalPage.inlineError().contains('Enter why you should be removed from this incident')
    })
  })

  it('A user will be shown a message if trying to request removal from deleted statement', () => {
    seedReport().then(() => {
      RequestRemovalPage.goTo(10)
      AlreadyRemovedPage.verifyOnPage()
    })
  })

  it('A user will be shown a message if trying to request removal from a statement they have already requested removal for', () => {
    seedReport().then(statementId => {
      cy.task('requestRemovalFromStatement', { statementId, reason: 'not working that day' })

      RequestRemovalPage.goTo(statementId)

      RemovalAlreadyRequestedPage.verifyOnPage()
    })
  })
})
