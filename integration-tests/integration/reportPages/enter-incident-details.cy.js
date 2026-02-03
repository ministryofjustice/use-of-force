import { format, parse, subDays } from 'date-fns'

const { offender } = require('../../mockApis/data')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')

context('Submitting incident details page', () => {
  const now = new Date()

  // Incident date is yesterday
  const incidentDate = subDays(now, 1)

  // UI input values
  const day = format(incidentDate, 'dd')
  const month = format(incidentDate, 'MM')
  const year = format(incidentDate, 'yyyy')

  // Helper to build Date objects (no moment)
  const makeDateTime = (date, time) => parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm:ss.SSS', new Date())

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderImage', offender.bookingId)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrisons')
    cy.task('stubUserDetailsRetrieval', ['AAAA', 'BBBB', 'TEST_USER'])
    cy.login()
  })

  const fillFormAndSave = () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()

    incidentDetailsPage.incidentDate.date().type(`${day}/${month}/${year}{esc}`)
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

    return incidentDetailsPage.save()
  }

  const fillFormUnplannedAndSave = () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()

    incidentDetailsPage.incidentDate.date().type(`${day}/${month}/${year}{esc}`)
    incidentDetailsPage.incidentDate.hour().type('09')
    incidentDetailsPage.incidentDate.minute().type('32')
    incidentDetailsPage.offenderName().contains('Norman Smith')
    incidentDetailsPage.prison().contains('Moorland')
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('false')

    incidentDetailsPage.witnesses(0).name().type('jimmy-ray')
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()
    incidentDetailsPage.addAnotherWitness().click()

    return incidentDetailsPage.save()
  }

  it('Can login and create a new report', () => {
    fillFormAndSave()

    cy.task('getFormSection', {
      bookingId: offender.bookingId,
      formName: 'incidentDetails',
    }).then(({ section, incidentDate: savedIncidentDate }) => {
      const expectedIncidentDate = makeDateTime(format(incidentDate, 'yyyy-MM-dd'), '09:32:00.000')

      // Normalize both sides to timestamps
      expect(new Date(savedIncidentDate).getTime()).to.equal(expectedIncidentDate.getTime())

      expect(section).to.deep.equal({
        incidentLocationId: '00000000-1111-2222-3333-444444444444',
        plannedUseOfForce: true,
        authorisedBy: 'Eric Bloodaxe',
        witnesses: [{ name: 'jimmy-ray' }],
      })
    })
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

    // Shouldn't be able to remove sole item
    updatedIncidentDetailsPage.witnesses(0).remove().should('not.exist')
  })

  it('Can login and create a new unplanned UoF report', () => {
    fillFormUnplannedAndSave()

    cy.task('getFormSection', {
      bookingId: offender.bookingId,
      formName: 'incidentDetails',
    }).then(({ section }) => {
      expect(section).to.deep.equal({
        incidentLocationId: '00000000-1111-2222-3333-444444444444',
        plannedUseOfForce: false,
        witnesses: [{ name: 'jimmy-ray' }],
      })
    })
  })
})
