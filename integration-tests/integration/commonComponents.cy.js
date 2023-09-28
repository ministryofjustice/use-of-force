const { offender } = require('../mockApis/data')
const ReportUseOfForcePage = require('../pages/createReport/reportUseOfForcePage')

context('Report use of force page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin', { firstName: 'James', lastName: 'Stuart' })
    cy.task('stubOffenderDetails', offender)
  })

  it('New components should exist', () => {
    cy.task('stubComponents')
    cy.login()

    const page = ReportUseOfForcePage.visit(offender.bookingId)
    page.commonComponentsHeader().should('exist')
    page.commonComponentsFooter().should('exist')
  })

  it('New components should not exist', () => {
    cy.task('stubComponentsFail')
    cy.login()

    const page = ReportUseOfForcePage.visit(offender.bookingId)
    page.commonComponentsHeader().should('not.exist')
    page.commonComponentsFooter().should('not.exist')
    page.fallbackHeaderUserName().contains('J. Stuart')
  })
})
