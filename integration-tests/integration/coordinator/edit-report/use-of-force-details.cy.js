import { offender } from '../../../mockApis/data'
import NotCompletedIncidentsPage from '../../../pages/reviewer/notCompletedIncidentsPage'
import ViewIncidentPage from '../../../pages/coordinator/viewIncidentPage'
import ReasonsForUseOfForcePage from '../../../pages/coordinator/reasonsForUseOfForcePage'
import PrimaryReasonForUseOfForcePage from '../../../pages/coordinator/primaryReasonForUseOfForcePage'
import UseOfForceDetailsPage from '../../../pages/coordinator/useOfForceDetailsPage'

import EditReportPage from '../../../pages/coordinator/editReportPage'
import EditHistoryPage from '../../../pages/coordinator/editHistoryPage'
import ReasonForChangePage from '../../../pages/coordinator/reasonForChangePage'

import { ReportStatus } from '../../../../server/config/types'

const moment = require('moment')

context("A use of force coordinator needs to edit a submitted report's Use of Force Details section", () => {
  const seedReport = () =>
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      incidentDate: moment('2019-09-10 09:57:00.000').toDate(),
      agencyId: 'MDI',
      bookingId: 1001,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubPrisons')
    cy.task('stubOffenders', [offender])
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.task('stubCoordinatorLogin')
    cy.login()
    seedReport()
  })

  it('edit the reasons page and select only one reason', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeUofDetailsLink().click()

    const reasonsPage = ReasonsForUseOfForcePage.verifyOnPage()
    reasonsPage.reasons().then(reasons => {
      expect(reasons).to.deep.equal(['FIGHT_BETWEEN_PRISONERS'])
    })
    reasonsPage.uncheckReason('FIGHT_BETWEEN_PRISONERS')
    reasonsPage.checkReason('TO_PREVENT_ESCAPE_OR_ABSCONDING')
    reasonsPage.clickContinue()

    // if there is only one reason, the primary reason page is skipped and journey goes straight to useOfForceDetailsPage

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.continueButton().click()

    const reasonForChangePage = ReasonForChangePage.verifyOnPage()
    reasonForChangePage
      .tableRowAndColHeading(1, 'question')
      .should('contain', 'Why was use of force applied against this prisoner')
    reasonForChangePage.tableRowAndColHeading(1, 'old-value').should('contain', 'Fight between prisoners')
    reasonForChangePage.tableRowAndColHeading(1, 'new-value').should('contain', 'To prevent escape or absconding')
    reasonForChangePage.radioAnotherReason().click()
    reasonForChangePage.anotherReasonText().type('Some more details')
    reasonForChangePage.additionalInfoText().type('Some even more additional details')
    reasonForChangePage.saveButton().click()

    ViewIncidentPage.verifyOnPage()
    viewIncidentPage.successBanner().should('exist')
    viewIncidentPage.reasonsForUseOfForce().should('contain', 'To prevent escape or absconding')
    viewIncidentPage.editHistoryLinkInSuccessBanner().click()

    const editHistoryPage = EditHistoryPage.verifyOnPage()
    editHistoryPage
      .tableRowAndColHeading(1, 'what-changed')
      .should('contain', 'Why was use of force applied against this prisoner?')
    editHistoryPage.tableRowAndColHeading(1, 'old-value').should('contain', 'Fight between prisoners')
    editHistoryPage.tableRowAndColHeading(1, 'new-value').should('contain', 'To prevent escape or absconding')
    editHistoryPage.tableRowAndColHeading(1, 'reason').should('contain', 'Another reason: Some more details')
  })

  it('edit reasons, primary reason and details page', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeUofDetailsLink().click()

    const reasonsPage = ReasonsForUseOfForcePage.verifyOnPage()
    reasonsPage.reasons().then(reasons => {
      expect(reasons).to.deep.equal(['FIGHT_BETWEEN_PRISONERS'])
    })
    reasonsPage.checkReason('TO_PREVENT_ESCAPE_OR_ABSCONDING')
    reasonsPage.clickContinue()

    const primaryReasonPage = PrimaryReasonForUseOfForcePage.verifyOnPage()
    primaryReasonPage.clickContinue()
    primaryReasonPage.errorSummaryTitle().contains('There is a problem')
    primaryReasonPage.errorSummaryText().contains('Select the primary reason for applying use of force')

    primaryReasonPage.checkReason('TO_PREVENT_ESCAPE_OR_ABSCONDING')
    primaryReasonPage.clickContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.continueButton().click()

    const reasonForChangePage = ReasonForChangePage.verifyOnPage()
    reasonForChangePage.backLink().click()

    UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.radio('positiveCommunication', 'false').click()
    useOfForceDetailsPage.radio('bodyWornCamera', 'NO').click()
    useOfForceDetailsPage.radio('personalProtectionTechniques', 'false').click()
    useOfForceDetailsPage.radio('batonDrawnAgainstPrisoner', 'false').click()
    useOfForceDetailsPage.radio('pavaDrawnAgainstPrisoner', 'false').click()
    useOfForceDetailsPage.radio('bittenByPrisonDog', 'false').click()
    useOfForceDetailsPage.radio('weaponsObserved', 'NO').click()
    useOfForceDetailsPage.radio('guidingHold', 'false').click()
    useOfForceDetailsPage.radio('escortingHold', 'false').click()
    useOfForceDetailsPage.checkBox('child-STANDING__UNDERHOOK').click()
    useOfForceDetailsPage.radio('handcuffsApplied', 'false').click()
    useOfForceDetailsPage.continueButton().click()

    ReasonForChangePage.verifyOnPage()

    const tableRows = [
      {
        row: 1,
        question: 'Why was use of force applied against this prisoner?',
        old: 'Fight between prisoners',
        new: 'Fight between prisoners, To prevent escape or absconding',
      },
      {
        row: 2,
        question: 'What was the primary reason use of force was applied against this prisoner?',
        old: 'Not applicable',
        new: 'To prevent escape or absconding',
      },
      {
        row: 3,
        question: 'Was positive communication used to de-escalate the situation with this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 4,
        question: 'Was any part of the incident captured on a body-worn camera?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 5,
        question: 'Camera numbers',
        old: '123, 789, 456',
        new: 'Not applicable',
      },
      {
        row: 6,
        question: 'Were any personal protection techniques used against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 7,
        question: 'Was a baton drawn by anyone against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 8,
        question: 'Was a baton used against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 9,
        question: 'Was PAVA drawn by anyone against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 10,
        question: 'Was PAVA used against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 11,
        question: 'Was the prisoner bitten by a prison dog?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 12,
        question: 'Were any weapons observed?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 13,
        question: 'Weapon type',
        old: 'gun, knife, fork',
        new: 'Not applicable',
      },
      {
        row: 14,
        question: 'Was a guiding hold used against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 15,
        question: 'How many officers were involved?',
        old: 2,
        new: 'Not applicable',
      },
      {
        row: 16,
        question: 'Was an escorting hold used against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
      {
        row: 17,
        question: 'Which control and restraint positions were used against this prisoner?',
        old: 'Standing: On back (supine), On front (prone), Kneeling',
        new: 'Standing: Underhook, On back (supine), On front (prone), Kneeling',
      },
      {
        row: 18,
        question: 'Were handcuffs applied against this prisoner?',
        old: 'Yes',
        new: 'No',
      },
    ]

    tableRows.forEach(({ row, question, old, new: newValue }) => {
      reasonForChangePage.tableRowAndColHeading(row, 'question').should('contain', question)
      reasonForChangePage.tableRowAndColHeading(row, 'old-value').should('contain', old)
      reasonForChangePage.tableRowAndColHeading(row, 'new-value').should('contain', newValue)
    })

    reasonForChangePage.radioAnotherReason().click()
    reasonForChangePage.anotherReasonText().type('Some more details')
    reasonForChangePage.additionalInfoText().type('Some even more additional details')
    reasonForChangePage.saveButton().click()

    ViewIncidentPage.verifyOnPage()
    viewIncidentPage
      .reasonsForUseOfForce()
      .should('contain', 'Fight between prisoners, To prevent escape or absconding')
    viewIncidentPage.successBanner().should('exist')
    viewIncidentPage.editHistoryLinkInSuccessBanner().click()

    const editHistoryPage = EditHistoryPage.verifyOnPage()

    tableRows.forEach(({ row, question, old, new: newValue }) => {
      editHistoryPage.tableRowAndColHeading(row, 'what-changed').should('contain', question)
      editHistoryPage.tableRowAndColHeading(row, 'old-value').should('contain', old)
      editHistoryPage.tableRowAndColHeading(row, 'new-value').should('contain', newValue)
    })
  })

  it('navigate using back links from /reason-for-change to /why-was-uof-applied page and still see in-progress selections', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeUofDetailsLink().click()

    const reasonsPage = ReasonsForUseOfForcePage.verifyOnPage()
    reasonsPage.reasons().then(reasons => {
      expect(reasons).to.deep.equal(['FIGHT_BETWEEN_PRISONERS'])
    })
    reasonsPage.checkReason('ASSAULT_ON_A_MEMBER_OF_STAFF')
    reasonsPage.clickContinue()

    const primaryReasonPage = PrimaryReasonForUseOfForcePage.verifyOnPage()
    primaryReasonPage.checkReason('ASSAULT_ON_A_MEMBER_OF_STAFF')
    primaryReasonPage.clickContinue()

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.radio('positiveCommunication', 'false').click()
    useOfForceDetailsPage.continueButton().click()

    const reasonForChangePage = ReasonForChangePage.verifyOnPage()

    const tableRows = [
      {
        row: 1,
        question: 'Why was use of force applied against this prisoner?',
        old: 'Fight between prisoners',
        new: 'Assault on a member of staff, Fight between prisoners',
      },
      {
        row: 2,
        question: 'What was the primary reason use of force was applied against this prisoner?',
        old: 'Not applicable',
        new: 'Assault on a member of staff',
      },
      {
        row: 3,
        question: 'Was positive communication used to de-escalate the situation with this prisoner?',
        old: 'Yes',
        new: 'No',
      },
    ]

    tableRows.forEach(({ row, question, old, new: newValue }) => {
      reasonForChangePage.tableRowAndColHeading(row, 'question').should('contain', question)
      reasonForChangePage.tableRowAndColHeading(row, 'old-value').should('contain', old)
      reasonForChangePage.tableRowAndColHeading(row, 'new-value').should('contain', newValue)
    })
    reasonForChangePage.backLink().click()

    UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.isCheckedRadio('positiveCommunication', 'false')
    useOfForceDetailsPage.clickBack()

    PrimaryReasonForUseOfForcePage.verifyOnPage()
    primaryReasonPage.primaryReason().should('have.value', 'ASSAULT_ON_A_MEMBER_OF_STAFF')
    primaryReasonPage.clickBack()

    ReasonsForUseOfForcePage.verifyOnPage()
    reasonsPage.reasons().then(reasons => {
      expect(reasons).to.deep.equal(['ASSAULT_ON_A_MEMBER_OF_STAFF', 'FIGHT_BETWEEN_PRISONERS'])
    })
  })
})
