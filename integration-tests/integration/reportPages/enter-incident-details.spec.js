const moment = require('moment')

const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')

context('Submitting details page form', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrisons')
    cy.task('stubUserDetailsRetrieval', ['AAAA', 'BBBB', 'TEST_USER'])
    cy.login()
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
    incidentDetailsPage.forceType.authorisedBy().type('Eric Bloodaxe')

    incidentDetailsPage.witnesses(0).name().type('jimmy-ray')
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()
    const detailsPage = incidentDetailsPage.save()
    return detailsPage
  }

  it('Can login and create a new report', () => {
    fillFormAndSave()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'incidentDetails' }).then(
      ({ section, incidentDate }) => {
        expect(moment(incidentDate).valueOf()).to.equal(moment('2020-01-12T09:32:00.000').valueOf())

        expect(section).to.deep.equal({
          locationId: 357591,
          plannedUseOfForce: true,
          authorisedBy: 'Eric Bloodaxe',
          witnesses: [{ name: 'jimmy-ray' }],
        })
      }
    )
  })

  it('Can revisit saved data', () => {
    fillFormAndSave()
    cy.go('back')

    const updatedIncidentDetailsPage = IncidentDetailsPage.verifyOnPage()
    updatedIncidentDetailsPage.offenderName().contains('Norman Smith')
    updatedIncidentDetailsPage.location().contains('Asso A Wing')
    updatedIncidentDetailsPage.forceType.planned().should('be.checked')
    updatedIncidentDetailsPage.forceType.authorisedBy().should('have.value', 'Eric Bloodaxe')

    updatedIncidentDetailsPage.witnesses(0).name().should('have.value', 'jimmy-ray')

    // Should't be able to remove sole item
    updatedIncidentDetailsPage.witnesses(0).remove().should('not.exist')
  })
})
