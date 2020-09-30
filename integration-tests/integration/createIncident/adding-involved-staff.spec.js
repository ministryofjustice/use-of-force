const { offender } = require('../../mockApis/data')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const StaffMemberNotFoundPage = require('../../pages/createReport/staffMemberNotFoundPage')
const WhatIsStaffMembersNamePage = require('../../pages/createReport/whatIsStaffMembersNamePage')
const StaffInvolvedPage = require('../../pages/createReport/staffInvolvedPage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')
const DeleteStaffMemberPage = require('../../pages/createReport/deleteStaffMemberPage')

context('Adding involved staff', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.login()
  })

  it('Adding and deleting staff', () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    let staffInvolvedPage = reportUseOfForcePage.goToInvolvedStaffPage()

    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([{ name: 'TEST_USER name', emailAddress: 'TEST_USER@gov.uk', canDelete: false }])
    })
    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    let whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.username().type('MR_ZAGATO')
    whatIsStaffMembersNamePage.clickContinue()

    staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'MR_ZAGATO name', emailAddress: 'MR_ZAGATO@gov.uk', canDelete: true },
      ])
    })
    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.username().type('MRS_JONES')
    whatIsStaffMembersNamePage.clickContinue()

    staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'MR_ZAGATO name', emailAddress: 'MR_ZAGATO@gov.uk', canDelete: true },
        { name: 'MRS_JONES name', emailAddress: 'MRS_JONES@gov.uk', canDelete: true },
      ])
    })
    staffInvolvedPage.deleteStaff('MR_ZAGATO').click()
    const deleteStaffMemberPage = DeleteStaffMemberPage.verifyOnPage('MR_ZAGATO')
    deleteStaffMemberPage.yes().click()
    deleteStaffMemberPage.clickContinue()

    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'MRS_JONES name', emailAddress: 'MRS_JONES@gov.uk', canDelete: true },
      ])
    })

    staffInvolvedPage.noMoreToAdd().click()
    staffInvolvedPage.clickSaveAndContinue()

    UseOfForceDetailsPage.verifyOnPage()
  })

  it('Only marked as complete after No more staff selected', () => {
    let reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    let staffInvolvedPage = reportUseOfForcePage.goToInvolvedStaffPage()

    staffInvolvedPage.clickSaveAndReturn()

    reportUseOfForcePage = ReportUseOfForcePage.verifyOnPage(offender.bookingId)

    reportUseOfForcePage.checkParts({
      incidentDetails: 'NOT_STARTED',
      staffInvolved: 'NOT_STARTED',
      useOfForceDetails: 'NOT_STARTED',
      relocationAndInjuries: 'NOT_STARTED',
      evidence: 'NOT_STARTED',
    })

    staffInvolvedPage = reportUseOfForcePage.goToInvolvedStaffPage()
    staffInvolvedPage.noMoreToAdd().click()
    staffInvolvedPage.clickSaveAndReturn()

    reportUseOfForcePage.checkParts({
      incidentDetails: 'NOT_STARTED',
      staffInvolved: 'COMPLETE',
      useOfForceDetails: 'NOT_STARTED',
      relocationAndInjuries: 'NOT_STARTED',
      evidence: 'NOT_STARTED',
    })
  })

  it('Adding missing staff member', () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const staffInvolvedPage = reportUseOfForcePage.goToInvolvedStaffPage()

    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    const whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.username().type('Does not exist')
    whatIsStaffMembersNamePage.clickContinue()

    const staffMemberNotFoundPage = StaffMemberNotFoundPage.verifyOnPage('Does not exist')
    staffMemberNotFoundPage.clickContinue()

    StaffInvolvedPage.verifyOnPage()
  })
})
