const moment = require('moment')
const TasklistPage = require('../../pages/tasklistPage')
const NewIncidentPage = require('../../pages/newIncidentPage')
const UserDoesNotExistPage = require('../../pages/userDoesNotExistPage')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubUserDetailsRetrieval', 'AAAA')
    cy.task('stubUserDetailsRetrieval', 'BBBB')
    cy.task('stubUserDetailsRetrieval', 'TEST_USER')
  })

  const fillFormAndSave = () => {
    const tasklistPage = TasklistPage.visit(bookingId)
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.offenderName().contains('Norman Smith')
    newIncidentPage.location().select('Asso A Wing')
    newIncidentPage.forceType.check('true')

    newIncidentPage
      .staffInvolved(0)
      .name()
      .type('AAAA')
    newIncidentPage.addAnotherStaff().click()
    newIncidentPage
      .staffInvolved(1)
      .name()
      .type('BBBB')

    newIncidentPage
      .witnesses(0)
      .name()
      .type('jimmy-ray')
    newIncidentPage.addAnotherWitness().click()
    newIncidentPage.addAnotherWitness().click()
    newIncidentPage.addAnotherWitness().click()
    const detailsPage = newIncidentPage.save()
    return detailsPage
  }

  it('Can edit date', () => {
    cy.login(bookingId)

    fillFormAndSave()

    cy.go('back')

    let incidentDetailsPage = NewIncidentPage.verifyOnPage()

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

    incidentDetailsPage = NewIncidentPage.verifyOnPage()
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
          },
          {
            email: 'BBBB@gov.uk',
            name: 'BBBB name',
            staffId: 231232,
            username: 'BBBB',
          },
        ],
      })
    })
  })

  it('Can revisit saved data', () => {
    cy.login(bookingId)

    fillFormAndSave()
    cy.go('back')

    const updatedIncidentPage = NewIncidentPage.verifyOnPage()
    updatedIncidentPage.offenderName().contains('Norman Smith')
    updatedIncidentPage.location().contains('Asso A Wing')
    updatedIncidentPage.forceType.planned().should('be.checked')

    updatedIncidentPage
      .staffInvolved(0)
      .name()
      .should('have.value', 'AAAA')
    updatedIncidentPage
      .staffInvolved(0)
      .remove()
      .should('exist')
    updatedIncidentPage
      .staffInvolved(1)
      .name()
      .should('have.value', 'BBBB')
    updatedIncidentPage
      .staffInvolved(1)
      .remove()
      .should('exist')

    updatedIncidentPage
      .witnesses(0)
      .name()
      .should('have.value', 'jimmy-ray')

    // Should't be able to remove sole item
    updatedIncidentPage
      .witnesses(0)
      .remove()
      .should('not.exist')
  })

  it('Adding missing involved staff', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)
    let newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.offenderName().contains('Norman Smith')
    newIncidentPage.location().select('Asso A Wing')
    newIncidentPage.forceType.check('true')

    newIncidentPage
      .staffInvolved(0)
      .name()
      .type('AAAA')
    newIncidentPage.addAnotherStaff().click()
    newIncidentPage
      .staffInvolved(1)
      .name()
      .type('CCCC')
    newIncidentPage.addAnotherStaff().click()
    newIncidentPage
      .staffInvolved(2)
      .name()
      .type('BBBB')
    newIncidentPage.addAnotherStaff().click()
    newIncidentPage
      .staffInvolved(3)
      .name()
      .type('DDDD')

    newIncidentPage.clickSave()
    let userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.missingUsers().then(users => expect(users).to.deep.equal(['CCCC', 'DDDD']))
    userDoesNotExistPage.return().click()

    newIncidentPage = NewIncidentPage.verifyOnPage()

    newIncidentPage
      .staffInvolved(0)
      .name()
      .should('have.value', 'AAAA')
    newIncidentPage
      .staffInvolved(1)
      .name()
      .should('have.value', 'CCCC')
    newIncidentPage
      .staffInvolved(2)
      .name()
      .should('have.value', 'BBBB')
    newIncidentPage
      .staffInvolved(3)
      .name()
      .should('have.value', 'DDDD')

    newIncidentPage.clickSave()
    userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.continue().click()

    cy.go('back')

    newIncidentPage = NewIncidentPage.verifyOnPage()
    newIncidentPage
      .staffInvolved(0)
      .name()
      .should('have.value', 'AAAA')
    newIncidentPage
      .staffInvolved(1)
      .name()
      .should('have.value', 'BBBB')
    newIncidentPage
      .staffInvolved(3)
      .name()
      .should('not.exist')
  })
})
