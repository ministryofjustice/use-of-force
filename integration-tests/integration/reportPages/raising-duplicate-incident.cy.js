const moment = require('moment')

const { offender } = require('../../mockApis/data')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const StaffInvolvedPage = require('../../pages/createReport/staffInvolvedPage')
const ReportMayAlreadyExistPage = require('../../pages/createReport/reportMayAlreadyExistPage')
const ReportCancelledPage = require('../../pages/createReport/reportCancelledPage')
const ReportAlreadyDeletedPage = require('../../pages/createReport/reportAlreadyDeletedPage')
const { ReportStatus } = require('../../../server/config/types')

context('Submitting duplicate report', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubPrisons')
    cy.task('stubUserDetailsRetrieval', ['AAAA', 'BBBB', 'TEST_USER'])
    cy.login()
  })

  const duplicateBooking = {
    status: ReportStatus.SUBMITTED,
    bookingId: 1001,
    offenderNumber: 'A1234AC',
    sequenceNumber: 1,
    incidentDate: moment('2020-01-12 09:57:40.000').toDate(),
  }

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
    return reportMayAlreadyExistPage
  }

  it('Only shows duplicates for the specific offender on the same day', () => {
    cy.task('seedReports', [
      // Day before
      { ...duplicateBooking, sequenceNumber: 1, incidentDate: moment('2020-01-11 23:59:59.000').toDate() },
      // Same day, different occurrence
      { ...duplicateBooking, sequenceNumber: 2, incidentDate: moment('2020-01-12 13:20:40.000').toDate() },
      // Same day
      { ...duplicateBooking, sequenceNumber: 3 },
      // Next day
      { ...duplicateBooking, sequenceNumber: 4, incidentDate: moment('2020-01-13 00:00:01.000').toDate() },
      // Same day, different offender
      { ...duplicateBooking, sequenceNumber: 5, offenderNumber: 'A1234AD', bookingId: 1002 },
    ])

    const reportMayAlreadyExistPage = createNewReport('save-and-continue')

    reportMayAlreadyExistPage.offenderName().contains('Norman Smith')
    reportMayAlreadyExistPage.getRows().should('have.length', 2)

    {
      const { dateTime, location, reporter } = reportMayAlreadyExistPage.getRow(0)
      dateTime().contains('Sunday 12 Jan 2020, 09:57')
      location().contains('ASSO A Wing')
      reporter().contains('James Stuart')
    }

    {
      const { dateTime, location, reporter } = reportMayAlreadyExistPage.getRow(1)
      dateTime().contains('Sunday 12 Jan 2020, 13:20')
      location().contains('ASSO A Wing')
      reporter().contains('James Stuart')
    }
  })

  it('Will cancel inProgress report', () => {
    cy.task('seedReports', [duplicateBooking])

    const reportMayAlreadyExistPage = createNewReport('save-and-continue')

    reportMayAlreadyExistPage.offenderName().contains('Norman Smith')
    reportMayAlreadyExistPage.getRows().should('have.length', 1)

    const { dateTime, location, reporter } = reportMayAlreadyExistPage.getRow(0)
    dateTime().contains('Sunday 12 Jan 2020')
    location().contains('ASSO A Wing')
    reporter().contains('James Stuart')

    reportMayAlreadyExistPage.cancelReport().click()
    reportMayAlreadyExistPage.saveAndContinue().click()

    const reportCancelledPage = ReportCancelledPage.verifyOnPage()
    reportCancelledPage.dpsLink().should('exist')
  })

  it('Will continue with inProgress report and go to the staff-involved page', () => {
    cy.task('seedReports', [duplicateBooking])
    const reportMayAlreadyExistPage = createNewReport('save-and-continue')
    reportMayAlreadyExistPage.continueReport().click()
    reportMayAlreadyExistPage.saveAndContinue().click()
    StaffInvolvedPage.verifyOnPage()
  })

  it('Will continue with inProgress report and go to the "task-list" page', () => {
    cy.task('seedReports', [duplicateBooking])
    const reportMayAlreadyExistPage = createNewReport('save-and-return')
    reportMayAlreadyExistPage.continueReport().click()
    reportMayAlreadyExistPage.saveAndContinue().click()
    ReportUseOfForcePage.verifyOnPage()
  })

  it('Will go to "This report has been deleted" page', () => {
    cy.task('seedReports', [duplicateBooking])
    const reportMayAlreadyExistPage = createNewReport('save-and-continue')
    reportMayAlreadyExistPage.cancelReport().click()
    reportMayAlreadyExistPage.saveAndContinue().click()
    cy.go('back')
    const reportAlreadyDeletedPage = ReportAlreadyDeletedPage.verifyOnPage()
    reportAlreadyDeletedPage.uofNotCompletedLink().should('exist')
  })
})
