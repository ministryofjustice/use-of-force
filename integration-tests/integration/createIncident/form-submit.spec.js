const { offender } = require('../../mockApis/data')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const ReportSentPage = require('../../pages/createReport/reportSentPage')
const WhatIsStaffMembersNamePage = require('../../pages/createReport/whatIsStaffMembersNamePage')
const StaffInvolvedPage = require('../../pages/createReport/staffInvolvedPage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')
const SelectUofReasonsPage = require('../../pages/createReport/selectUofReasonsPage')

const { ReportStatus } = require('../../../server/config/types')
const { expectedPayload } = require('../seedData')

context('Submit the incident report', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubPrisons')
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('Submitting a form', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const incidentDetailsPage = reportUseOfForcePage.startNewForm()
    incidentDetailsPage.fillForm()

    let staffInvolvedPage = incidentDetailsPage.save()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
      ])
    })
    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    let whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.firstName().type('Emily')
    whatIsStaffMembersNamePage.lastName().type('Jones')
    cy.task('stubFindUsers', { firstName: 'Emily', lastName: 'Jones' })
    whatIsStaffMembersNamePage.clickContinue()

    staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'Emily Jones', prison: 'None', emailAddress: 'Emily@gov.uk', canDelete: true },
      ])
    })
    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.firstName().type('Jo')
    whatIsStaffMembersNamePage.lastName().type('Zagato')
    cy.task('stubFindUsers', { firstName: 'Jo', lastName: 'Zagato' })
    whatIsStaffMembersNamePage.clickContinue()

    staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'Emily Jones', prison: 'None', emailAddress: 'Emily@gov.uk', canDelete: true },
        { name: 'Jo Zagato', prison: 'None', emailAddress: 'Jo@gov.uk', canDelete: true },
      ])
    })
    staffInvolvedPage.noMoreToAdd().click()
    staffInvolvedPage.clickSaveAndContinue()

    const selectUofReasonsPage = SelectUofReasonsPage.verifyOnPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.clickSaveAndContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.fillForm()
    const relocationAndInjuriesPage = useOfForceDetailsPage.save()
    relocationAndInjuriesPage.fillForm()
    const evidencePage = relocationAndInjuriesPage.save()
    evidencePage.fillForm()
    const checkAnswersPage = evidencePage.save()

    checkAnswersPage.clickSubmit()
    const reportSentPage = ReportSentPage.verifyOnPage()

    reportSentPage.getReportId().then(reportId =>
      cy.task('getAllStatementsForReport', reportId).then(staff =>
        expect(staff).to.deep.equal([
          { name: 'TEST_USER name', email: 'TEST_USER@gov.uk', userid: 'TEST_USER', status: 'PENDING' },
          { name: 'Emily Jones', email: 'Emily@gov.uk', userid: 'EMILY_JONES', status: 'PENDING' },
          { name: 'Jo Zagato', email: 'Jo@gov.uk', userid: 'JO_ZAGATO', status: 'PENDING' },
        ])
      )
    )

    reportSentPage
      .getReportId()
      .then(reportId => cy.task('getReport', reportId).then(report => expect(report).to.deep.equal(expectedPayload)))
  })

  it('After submitting, can not resubmit', () => {
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    let reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    let checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    checkAnswersPage.backToTasklist().click()

    reportUseOfForcePage = ReportUseOfForcePage.verifyOnPage()

    checkAnswersPage = reportUseOfForcePage.goToAnswerPage()
    checkAnswersPage.clickSubmit()

    ReportSentPage.verifyOnPage()

    cy.go('back')

    YourStatementsPage.verifyOnPage()
  })

  it('Can exit after completing report and before creating statement', () => {
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      involvedStaff: [],
    })

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const checkAnswersPage = reportUseOfForcePage.goToAnswerPage()

    checkAnswersPage.clickSubmit()

    ReportSentPage.verifyOnPage().exit().click()

    // Exit location is configurable - in dev this points to / which for this user redirects to 'Your statements'
    YourStatementsPage.verifyOnPage()
  })
})
