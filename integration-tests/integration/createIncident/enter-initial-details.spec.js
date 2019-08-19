const moment = require('moment')
const TasklistPage = require('../../pages/tasklistPage')
const newIncidentPageFactory = require('../../pages/newIncidentPage')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
    cy.task('stubUserDetailsRetrieval', 'AAAA')
    cy.task('stubUserDetailsRetrieval', 'BBBB')
  })

  const fillFormAndSave = () => {
    const tasklistPage = TasklistPage.visit(bookingId)
    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.offenderName().contains('Norman Smith (A1234AC)')
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
      .type('1111')
    newIncidentPage.addAnotherWitness().click()
    newIncidentPage.addAnotherWitness().click()
    newIncidentPage.addAnotherWitness().click()
    const detailsPage = newIncidentPage.save()
    return detailsPage
  }

  it('Can login and create a new report', () => {
    cy.login(bookingId)

    fillFormAndSave()

    cy.task('getCurrentDraft', { bookingId, formName: 'newIncident' }).then(({ data, staff }) => {
      const { incidentDate, ...payload } = data

      const incidentDateInMillis = moment(incidentDate).valueOf()
      const nowInMillis = moment().valueOf()

      const millisBetweenSavedDateAndNow = nowInMillis - incidentDateInMillis
      expect(millisBetweenSavedDateAndNow).to.be.above(0)

      expect(payload).to.deep.equal({
        locationId: 357591,
        plannedUseOfForce: true,
        witnesses: [{ name: '1111' }],
      })
      expect(staff).to.deep.equal([
        { userId: 'AAAA', name: 'AAAA name', email: 'AAAA@gov.uk' },
        { userId: 'BBBB', name: 'BBBB name', email: 'BBBB@gov.uk' },
      ])
    })
  })

  it('Can revisit saved data', () => {
    cy.login(bookingId)

    const detailsPage = fillFormAndSave()
    detailsPage.back().click()

    const updatedIncidentPage = newIncidentPageFactory()
    updatedIncidentPage.offenderName().contains('Norman Smith (A1234AC)')
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
      .should('have.value', '1111')

    // Should't be able to remove sole item
    updatedIncidentPage
      .witnesses(0)
      .remove()
      .should('not.exist')
  })
})
