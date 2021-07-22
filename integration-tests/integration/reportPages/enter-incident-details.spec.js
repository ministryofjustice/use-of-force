const moment = require('moment')

const { offender } = require('../../mockApis/data')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const StaffInvolvedPage = require('../../pages/createReport/staffInvolvedPage')
const IncidentDetailsPage = require('../../pages/createReport/incidentDetailsPage')
const ReportMayAlreadyExistPage = require('../../pages/createReport/reportMayAlreadyExistPage')
const ReportCancelledPage = require('../../pages/createReport/reportCancelledPage')
const ReportAlreadyDeletedPage = require('../../pages/createReport/reportAlreadyDeletedPage')
const { ReportStatus } = require('../../../server/config/types')

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

  const fillFormUnplannedAndSave = () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()

    incidentDetailsPage.incidentDate.date().type('12/01/2020{esc}')
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
    const detailsPage = incidentDetailsPage.save()
    return detailsPage
  }

  const seedReport = () =>
    cy.task('seedReport', {
      reporterName: 'James Stuart',
      bookingId: 1001,
      offenderNumber: 'A1234AC',
      incidentDate: moment('2020-01-12 09:57:40.000').toDate(),
      submittedDate: moment('2020-01-12 10:30:43.122').toDate(),
      overdueDate: moment('2020-01-12 10:30:43.122').add(3, 'd').toDate(),
      sequenceNumber: 0,
      username: 'TEST_USER',
      status: ReportStatus.SUBMITTED,
      agencyId: 'MDI',
      involvedStaff: [],
    })

  const createNewReport = directionFollowingSave => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.incidentDate.date().type('12/01/2020{esc}')
    incidentDetailsPage.incidentDate.hour().type('09')
    incidentDetailsPage.incidentDate.minute().type('32')
    incidentDetailsPage.offenderName().contains('Norman Smith')
    incidentDetailsPage.prison().contains('Moorland')
    incidentDetailsPage.location().select('Asso A Wing')
    incidentDetailsPage.forceType.check('false')
    incidentDetailsPage.clickContinueOrReturn(directionFollowingSave)

    const reportMayAlreadyExistPage = ReportMayAlreadyExistPage.verifyOnPage()
    reportMayAlreadyExistPage.offenderName().contains('Norman Smith')
    reportMayAlreadyExistPage.date().contains('Sunday 12 Jan 2020')
    reportMayAlreadyExistPage.location().contains('ASSO A Wing')
    reportMayAlreadyExistPage.reporter().contains('James Stuart')
    reportMayAlreadyExistPage.saveAndContinueButton().should('exist')
    reportMayAlreadyExistPage.cancelReportYesRadio().should('exist')
    reportMayAlreadyExistPage.cancelReportNoRadio().should('exist')
    return reportMayAlreadyExistPage
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

  it('Can login and create a new unplanned UoF report', () => {
    fillFormUnplannedAndSave()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'incidentDetails' }).then(({ section }) => {
      expect(section).to.deep.equal({
        locationId: 357591,
        plannedUseOfForce: false,
        witnesses: [{ name: 'jimmy-ray' }],
      })
    })
  })
  it('Will go to the "Report may already exist" page', () => {
    seedReport()
    cy.task('stubLocation', '357591')
    createNewReport('save-and-continue')
  })

  it('Will cancel inProgress report', () => {
    seedReport()
    cy.task('stubLocation', '357591')
    const reportMayAlreadyExistPage = createNewReport('save-and-continue')
    reportMayAlreadyExistPage.cancelReportYesRadio().click()
    reportMayAlreadyExistPage.saveAndContinueButton().click()
    const reportCancelledPage = ReportCancelledPage.verifyOnPage()
    reportCancelledPage.dpsLink().should('exist')
  })

  it('Will continue with inProgress report and go to the staff-involved page', () => {
    seedReport()
    cy.task('stubLocation', '357591')
    const reportMayAlreadyExistPage = createNewReport('save-and-continue')
    reportMayAlreadyExistPage.cancelReportNoRadio().click()
    reportMayAlreadyExistPage.saveAndContinueButton().click()
    StaffInvolvedPage.verifyOnPage()
  })
  it('Will continue with inProgress report and go to the "task-list" page', () => {
    seedReport()
    cy.task('stubLocation', '357591')
    const reportMayAlreadyExistPage = createNewReport('save-and-return')
    reportMayAlreadyExistPage.cancelReportNoRadio().click()
    reportMayAlreadyExistPage.saveAndContinueButton().click()
    ReportUseOfForcePage.verifyOnPage()
  })
  it('Will go to "This report has been deleted" page', () => {
    seedReport()
    cy.task('stubLocation', '357591')
    const reportMayAlreadyExistPage = createNewReport('save-and-continue')
    reportMayAlreadyExistPage.cancelReportYesRadio().click()
    reportMayAlreadyExistPage.saveAndContinueButton().click()
    cy.go('back')
    const reportAlreadyDeletedPage = ReportAlreadyDeletedPage.verifyOnPage()
    reportAlreadyDeletedPage.uofNotCompletedLink().should('exist')
  })
})
