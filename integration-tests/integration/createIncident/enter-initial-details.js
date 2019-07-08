const TasklistPage = require('../../pages/tasklistPage')

context('Submitting details page form', () => {
  const bookingId = 1001
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', bookingId)
    cy.task('stubLocations', 'MDI')
  })

  it('Can login and create a new incident', () => {
    cy.login(bookingId)

    const tasklistPage = TasklistPage.visit(bookingId)

    const newIncidentPage = tasklistPage.startNewForm()
    newIncidentPage.offenderName().contains('Norman Smith (A1234AC)')
    newIncidentPage.location().select('Asso A Wing')
    newIncidentPage.forceType().select('Spontaneous')

    newIncidentPage.staffInvolved(0).type('AAAA')
    newIncidentPage.addAnotherStaff().click()
    newIncidentPage.staffInvolved(1).type('BBBB')

    newIncidentPage.witnesses(0).type('1111')
    newIncidentPage.addAnotherWitness().click()
    newIncidentPage.witnesses(1).type('2222')
    newIncidentPage.addAnotherWitness().click()
    newIncidentPage.addAnotherWitness().click()
    newIncidentPage.save()

    cy.task('getFormData', { bookingId, formName: 'newIncident' }).then(data =>
      expect(data).to.deep.equal({
        locationId: 357591,
        involved: [{ name: 'AAAA' }, { name: 'BBBB' }],
        forceType: 'spontaneous',
        witnesses: [{ name: '1111' }, { name: '2222' }],
      })
    )
  })
})
