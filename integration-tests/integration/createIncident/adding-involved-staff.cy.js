const { offender } = require('../../mockApis/data')
const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const StaffMemberNotFoundPage = require('../../pages/createReport/staffMemberNotFoundPage')
const WhatIsStaffMembersNamePage = require('../../pages/createReport/whatIsStaffMembersNamePage')
const StaffInvolvedPage = require('../../pages/createReport/staffInvolvedPage')
const SelectUofReasonsPage = require('../../pages/createReport/selectUofReasonsPage')

const DeleteStaffMemberPage = require('../../pages/createReport/deleteStaffMemberPage')
const SelectStaffMemberPage = require('../../pages/createReport/selectStaffMemberPage')

const dpsLocationId = '00000000-1111-2222-3333-444444444444'

context('Adding involved staff', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderImage', offender.bookingId)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubLocation', dpsLocationId)
    cy.task('stubOffenders', [offender])
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrisons')
    cy.task('stubLocation', dpsLocationId)
    cy.task('stubUserDetailsRetrieval', ['JO_JONES', 'TEST_USER', 'BOB_SMITH', 'EMILY_JONES'])
    cy.login()
  })

  it('Adding and deleting staff', () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    let staffInvolvedPage = reportUseOfForcePage.goToInvolvedStaffPage()

    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
      ])
    })
    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    let whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.firstName().type('Bob')
    whatIsStaffMembersNamePage.lastName().type('Smith')

    cy.task('stubFindUsers', { userName: 'BOB_SMITH', firstName: 'Bob', lastName: 'Smith' })

    whatIsStaffMembersNamePage.clickContinue()

    staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'Bob Smith', prison: 'None', emailAddress: 'Bob@gov.uk', canDelete: true },
      ])
    })
    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.firstName().type('Emily')
    whatIsStaffMembersNamePage.lastName().type('Jones')

    cy.task('stubFindUsers', { username: 'EMILY_JONES', firstName: 'Emily', lastName: 'Jones' })

    whatIsStaffMembersNamePage.clickContinue()

    staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'Bob Smith', prison: 'None', emailAddress: 'Bob@gov.uk', canDelete: true },
        { name: 'Emily Jones', prison: 'None', emailAddress: 'Emily@gov.uk', canDelete: true },
      ])
    })
    staffInvolvedPage.deleteStaff('EMILY_JONES').click()
    const deleteStaffMemberPage = DeleteStaffMemberPage.verifyOnPage('Emily Jones')
    deleteStaffMemberPage.yes().click()
    deleteStaffMemberPage.clickContinue()

    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'Bob Smith', prison: 'None', emailAddress: 'Bob@gov.uk', canDelete: true },
      ])
    })

    staffInvolvedPage.noMoreToAdd().click()
    staffInvolvedPage.clickSaveAndContinue()

    SelectUofReasonsPage.verifyOnPage()
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
    whatIsStaffMembersNamePage.firstName().type('Does')
    whatIsStaffMembersNamePage.lastName().type('not exist')

    cy.task('stubFindUsers', { firstName: 'Does', lastName: 'not exist', results: [] })
    whatIsStaffMembersNamePage.clickContinue()

    const staffMemberNotFoundPage = StaffMemberNotFoundPage.verifyOnPage('Does Not Exist')
    staffMemberNotFoundPage.clickContinue()

    StaffInvolvedPage.verifyOnPage()
  })

  it('Multiple staff found', () => {
    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    let staffInvolvedPage = reportUseOfForcePage.goToInvolvedStaffPage()

    staffInvolvedPage.addAStaffMember().click()
    staffInvolvedPage.clickSaveAndContinue()

    const whatIsStaffMembersNamePage = WhatIsStaffMembersNamePage.verifyOnPage()
    whatIsStaffMembersNamePage.firstName().type('Jo')
    whatIsStaffMembersNamePage.lastName().type('Jones')

    cy.task('stubFindUsers', {
      firstName: 'Jo',
      lastName: 'Jones',
      results: [
        {
          username: `USER-1`,
          verified: true,
          email: `joJones2@gov.uk`,
          name: `Jo Jones`,
          staffId: 1,
          activeCaseLoadId: 'MDI',
        },
        {
          username: `JO_JONES`,
          verified: true,
          email: `joJones1@gov.uk`,
          name: `Jo Jones`,
          staffId: 2,
          activeCaseLoadId: 'RSI',
        },
      ],
    })
    whatIsStaffMembersNamePage.clickContinue()

    const selectStaffMemberPage = SelectStaffMemberPage.verifyOnPage()
    {
      const { prison, username, email } = selectStaffMemberPage.match(0)
      prison().should('contain', 'HMP Moorland')
      username().should('contain', 'USER-1')
      email().should('contain', 'joJones2@gov.uk')
    }
    {
      const { prison, username, email } = selectStaffMemberPage.match(1)
      prison().should('contain', 'HMP Risley')
      username().should('contain', 'JO_JONES')
      email().should('contain', 'joJones1@gov.uk')
    }

    selectStaffMemberPage.select('JO_JONES').click()
    selectStaffMemberPage.clickContinue()

    staffInvolvedPage = StaffInvolvedPage.verifyOnPage()
    staffInvolvedPage.presentStaff().then(staff => {
      expect(staff).to.deep.equal([
        { name: 'TEST_USER name', prison: 'HMP Moorland', emailAddress: 'TEST_USER@gov.uk', canDelete: false },
        { name: 'JO_JONES name', prison: 'HMP Moorland', emailAddress: 'JO_JONES@gov.uk', canDelete: true },
      ])
    })
  })
})
