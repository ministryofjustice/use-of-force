const moment = require('moment')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const UserDoesNotExistPage = require('../../pages/createReport/userDoesNotExistPage')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubPrison', 'MDI')
    cy.task('stubUserDetailsRetrieval', 'AAAA')
    cy.task('stubUserDetailsRetrieval', 'BBBB')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  const fillFormAndSave = () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.offenderName().contains('Norman Smith')
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
      .type('BBBB')

    incidentDetailsPage
      .witnesses(0)
      .name()
      .type('jimmy-ray')
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()
    const detailsPage = incidentDetailsPage.save()
    return detailsPage
  }

  it('Can edit date', () => {
    cy.login(bookingId)

    fillFormAndSave()

    cy.go('back')

    let incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.incidentDateTime.day().should('not.be.visible')
    incidentDetailsPage.incidentDateTime.month().should('not.be.visible')
    incidentDetailsPage.incidentDateTime.year().should('not.be.visible')
    incidentDetailsPage.incidentDateTime.readOnlyView().should('be.visible')

    incidentDetailsPage.incidentDateTime.change().click()

    incidentDetailsPage.incidentDateTime.day().should('be.visible')
    incidentDetailsPage.incidentDateTime.month().should('be.visible')
    incidentDetailsPage.incidentDateTime.year().should('be.visible')
    incidentDetailsPage.incidentDateTime.readOnlyView().should('not.be.visible')

    incidentDetailsPage.incidentDateTime
      .day()
      .clear()
      .type('1')
    incidentDetailsPage.incidentDateTime
      .month()
      .clear()
      .type('1')
    incidentDetailsPage.incidentDateTime
      .year()
      .clear()
      .type('2011')
    incidentDetailsPage.incidentDateTime
      .time()
      .clear()
      .type('11:11')
    incidentDetailsPage.save()
    cy.go('back')

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    incidentDetailsPage.incidentDateTime.day().should('not.be.visible')
    incidentDetailsPage.incidentDateTime.month().should('not.be.visible')
    incidentDetailsPage.incidentDateTime.year().should('not.be.visible')

    incidentDetailsPage.incidentDateTime.readOnlyView().contains('1 January 2011')
    incidentDetailsPage.incidentDateTime.time().should('have.value', '11:11')
  })

  it('Can login and create a new report', () => {
    cy.login(bookingId)

    fillFormAndSave()

    cy.task('getCurrentDraft', { bookingId, formName: 'incidentDetails' }).then(({ payload, incidentDate }) => {
      const incidentDateInMillis = moment(incidentDate).valueOf()
      const nowInMillis = moment().valueOf()

      const millisBetweenSavedDateAndNow = nowInMillis - incidentDateInMillis
      expect(millisBetweenSavedDateAndNow).to.be.above(0)

      expect(payload).to.deep.equal({
        locationId: 357591,
        plannedUseOfForce: true,
        witnesses: [{ name: 'jimmy-ray' }],
        involvedStaff: [
          {
            email: 'AAAA@gov.uk',
            name: 'AAAA name',
            staffId: 231232,
            username: 'AAAA',
            missing: false,
            verified: true,
          },
          {
            email: 'BBBB@gov.uk',
            name: 'BBBB name',
            staffId: 231232,
            username: 'BBBB',
            missing: false,
            verified: true,
          },
        ],
      })
    })
  })

  it('Can revisit saved data', () => {
    cy.login(bookingId)

    fillFormAndSave()
    cy.go('back')

    const updatedIncidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    updatedIncidentDetailsPage.offenderName().contains('Norman Smith')
    updatedIncidentDetailsPage.location().contains('Asso A Wing')
    updatedIncidentDetailsPage.forceType.planned().should('be.checked')

    updatedIncidentDetailsPage
      .staffInvolved(0)
      .name()
      .should('have.value', 'AAAA')
    updatedIncidentDetailsPage
      .staffInvolved(0)
      .remove()
      .should('exist')
    updatedIncidentDetailsPage
      .staffInvolved(1)
      .name()
      .should('have.value', 'BBBB')
    updatedIncidentDetailsPage
      .staffInvolved(1)
      .remove()
      .should('exist')

    updatedIncidentDetailsPage
      .witnesses(0)
      .name()
      .should('have.value', 'jimmy-ray')

    // Should't be able to remove sole item
    updatedIncidentDetailsPage
      .witnesses(0)
      .remove()
      .should('not.exist')
  })

  it('Adding missing involved staff', () => {
    cy.login(bookingId)

    const reportUseOfForcePage = ReportUseOfForcePage.visit(bookingId)
    let incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.offenderName().contains('Norman Smith')
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
      .type('CCCC')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage
      .staffInvolved(2)
      .name()
      .type('BBBB')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage
      .staffInvolved(3)
      .name()
      .type('DDDD')

    incidentDetailsPage.clickSave()
    let userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.missingUsers().then(users => expect(users).to.deep.equal(['CCCC', 'DDDD']))
    userDoesNotExistPage.return().click()

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage
      .staffInvolved(0)
      .name()
      .should('have.value', 'AAAA')
    incidentDetailsPage
      .staffInvolved(1)
      .name()
      .should('have.value', 'CCCC')
    incidentDetailsPage
      .staffInvolved(2)
      .name()
      .should('have.value', 'BBBB')
    incidentDetailsPage
      .staffInvolved(3)
      .name()
      .should('have.value', 'DDDD')

    incidentDetailsPage.clickSave()
    userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.continue().click()

    cy.go('back')

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    incidentDetailsPage
      .staffInvolved(0)
      .name()
      .should('have.value', 'AAAA')
    incidentDetailsPage
      .staffInvolved(1)
      .name()
      .should('have.value', 'BBBB')
    incidentDetailsPage
      .staffInvolved(3)
      .name()
      .should('not.exist')
  })
})
