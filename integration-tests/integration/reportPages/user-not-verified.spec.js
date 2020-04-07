const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const UserDoesNotExistPage = require('../../pages/createReport/userDoesNotExistPage')
const UserNotVerifiedPage = require('../../pages/createReport/userNotVerifiedPage')
const CheckAnswersPage = require('../../pages/createReport/checkAnswersPage')
const { ReportStatus } = require('../../../server/config/types')
const { expectedPayload } = require('../seedData')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', 'AAAA')
    cy.task('stubUserDetailsRetrieval', 'BBBB')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
    cy.task('stubUnverifiedUserDetailsRetrieval', 'UNVERIFIED_USER')
  })

  it('Adding unverified involved staff', () => {
    cy.login(bookingId)

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('true')

    incidentDetailsPage
      .staffInvolved(0)
      .name()
      .type('AAAA')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage
      .staffInvolved(1)
      .name()
      .type('UNVERIFIED_USER')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage
      .staffInvolved(2)
      .name()
      .type('BBBB')
    incidentDetailsPage.addAnotherStaff().click()

    incidentDetailsPage.clickSave()
    const userNotVerifiedPage = UserNotVerifiedPage.verifyOnPage('UNVERIFIED_USER')
    userNotVerifiedPage.continue().click()

    UseOfForceDetailsPage.verifyOnPage()
  })

  it('Adding unverified and missing involved staff', () => {
    cy.login(bookingId)

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('true')

    incidentDetailsPage
      .staffInvolved(0)
      .name()
      .type('AAAA')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage
      .staffInvolved(1)
      .name()
      .type('UNVERIFIED_USER')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage
      .staffInvolved(2)
      .name()
      .type('MISSING_USER')
    incidentDetailsPage.addAnotherStaff().click()

    incidentDetailsPage.clickSave()
    const userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.missingUsers().then(users => expect(users).to.deep.equal(['MISSING_USER']))
    userDoesNotExistPage.continue().click()

    const userNotVerifiedPage = UserNotVerifiedPage.verifyOnPage('UNVERIFIED_USER')
    userNotVerifiedPage.continue().click()

    UseOfForceDetailsPage.verifyOnPage()
  })

  it('Adding unverified and missing involved staff from edit', () => {
    cy.login(bookingId)

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
      payload: { ...expectedPayload, incidentDetails: { ...expectedPayload.incidentDetails, involvedStaff: [] } },
    })

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()
    checkAnswersPage.editIncidentDetailsLink().click()
    let incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage
      .staffInvolved(0)
      .name()
      .type('UNVERIFIED_USER')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage
      .staffInvolved(1)
      .name()
      .type('MISSING_USER')
    incidentDetailsPage.addAnotherStaff().click()

    incidentDetailsPage.clickSave()
    let userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.missingUsers().then(users => expect(users).to.deep.equal(['MISSING_USER']))
    // check destination propagates through user changing there mind back and forth again.
    userDoesNotExistPage.return().click()

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    incidentDetailsPage.clickSave()
    userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.missingUsers().then(users => expect(users).to.deep.equal(['MISSING_USER']))
    userDoesNotExistPage.continue().click()

    const userNotVerifiedPage = UserNotVerifiedPage.verifyOnPage('UNVERIFIED_USER')
    userNotVerifiedPage.continue().click()

    CheckAnswersPage.verifyOnPage()
  })
})
