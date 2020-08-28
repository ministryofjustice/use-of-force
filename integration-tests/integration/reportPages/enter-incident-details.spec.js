const moment = require('moment')

const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const UserDoesNotExistPage = require('../../pages/createReport/userDoesNotExistPage')

context('Submitting details page form', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubUserDetailsRetrieval', ['AAAA', 'BBBB', 'TEST_USER'])
  })

  const fillFormAndSave = () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()

    incidentDetailsPage.incidentDate.date().type('12/01/2020{esc}')
    incidentDetailsPage.incidentDate.hour().type('09')
    incidentDetailsPage.incidentDate.minute().type('32')
    incidentDetailsPage.offenderName().contains('Norman Smith')
    incidentDetailsPage.prison().contains('Moorland')
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('true')

    incidentDetailsPage.staffInvolved(0).name().type('AAAA')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage.staffInvolved(1).name().type('BBBB')

    incidentDetailsPage.witnesses(0).name().type('jimmy-ray')
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()
    const detailsPage = incidentDetailsPage.save()
    return detailsPage
  }

  it('Can login and create a new report', () => {
    cy.login()

    fillFormAndSave()

    cy.task('getCurrentDraft', { bookingId: offender.bookingId, formName: 'incidentDetails' }).then(
      ({ payload, incidentDate }) => {
        expect(moment(incidentDate).valueOf()).to.equal(moment('2020-01-12T09:32:00.000').valueOf())

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
      }
    )
  })

  it('Can revisit saved data', () => {
    cy.login()

    fillFormAndSave()
    cy.go('back')

    const updatedIncidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    updatedIncidentDetailsPage.offenderName().contains('Norman Smith')
    updatedIncidentDetailsPage.location().contains('Asso A Wing')
    updatedIncidentDetailsPage.forceType.planned().should('be.checked')

    updatedIncidentDetailsPage.staffInvolved(0).name().should('have.value', 'AAAA')
    updatedIncidentDetailsPage.staffInvolved(0).remove().should('exist')
    updatedIncidentDetailsPage.staffInvolved(1).name().should('have.value', 'BBBB')
    updatedIncidentDetailsPage.staffInvolved(1).remove().should('exist')

    updatedIncidentDetailsPage.witnesses(0).name().should('have.value', 'jimmy-ray')

    // Should't be able to remove sole item
    updatedIncidentDetailsPage.witnesses(0).remove().should('not.exist')
  })

  it('Adding missing involved staff', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    let incidentDetailsPage = reportUseOfForcePage.startNewForm()

    incidentDetailsPage.incidentDate.date().type('12/01/2020{esc}')
    incidentDetailsPage.incidentDate.hour().type('09')
    incidentDetailsPage.incidentDate.minute().type('32')
    incidentDetailsPage.offenderName().contains('Norman Smith')
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('true')

    incidentDetailsPage.staffInvolved(0).name().type('AAAA')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage.staffInvolved(1).name().type('CCCC')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage.staffInvolved(2).name().type('BBBB')
    incidentDetailsPage.addAnotherStaff().click()
    incidentDetailsPage.staffInvolved(3).name().type('DDDD')

    incidentDetailsPage.clickSave()
    let userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.missingUsers().then(users => expect(users).to.deep.equal(['CCCC', 'DDDD']))
    userDoesNotExistPage.return().click()

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()

    incidentDetailsPage.staffInvolved(0).name().should('have.value', 'AAAA')
    incidentDetailsPage.staffInvolved(1).name().should('have.value', 'CCCC')
    incidentDetailsPage.staffInvolved(2).name().should('have.value', 'BBBB')
    incidentDetailsPage.staffInvolved(3).name().should('have.value', 'DDDD')

    incidentDetailsPage.clickSave()
    userDoesNotExistPage = UserDoesNotExistPage.verifyOnPage()
    userDoesNotExistPage.continue().click()

    cy.go('back')

    incidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    incidentDetailsPage.staffInvolved(0).name().should('have.value', 'AAAA')
    incidentDetailsPage.staffInvolved(1).name().should('have.value', 'BBBB')
    incidentDetailsPage.staffInvolved(3).name().should('not.exist')
  })
})
