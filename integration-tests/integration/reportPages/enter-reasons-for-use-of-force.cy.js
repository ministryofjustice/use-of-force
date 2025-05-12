const moment = require('moment')
const { offender } = require('../../mockApis/data')

const ReportUseOfForcePage = require('../../pages/createReport/reportUseOfForcePage')
const UseOfForceDetailsPage = require('../../pages/createReport/useOfForceDetailsPage')
const SelectUofReasonsPage = require('../../pages/createReport/selectUofReasonsPage')
const SelectPrimaryUofReasonPage = require('../../pages/createReport/selectPrimaryUofReasonPage')
const CheckAnswersPage = require('../../pages/createReport/checkAnswersPage')

const { ReportStatus } = require('../../../server/config/types')

context('Enter reasons for use of force', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubLocation', '00000000-1111-2222-3333-444444444444')
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubUserDetailsRetrieval', ['TEST_USER', 'MR_ZAGATO', 'MRS_JONES'])
  })

  it('single reason is saved correctly', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.clickSaveAndContinue()

    UseOfForceDetailsPage.verifyOnPage()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'reasonsForUseOfForce' }).then(
      ({ section }) => {
        expect(section).to.deep.equal({
          reasons: ['FIGHT_BETWEEN_PRISONERS'],
        })
      }
    )
  })

  it('multiple reasons saved correctly', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
    selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
    selectUofReasonsPage.checkReason('VERBAL_THREAT')
    selectUofReasonsPage.checkReason('REFUSAL_TO_LOCATE_TO_CELL')

    selectUofReasonsPage.clickSaveAndContinue()

    const selectPrimaryUofReasonPage = SelectPrimaryUofReasonPage.verifyOnPage()
    selectPrimaryUofReasonPage.checkReason('VERBAL_THREAT')
    selectPrimaryUofReasonPage.clickSaveAndContinue()

    UseOfForceDetailsPage.verifyOnPage()

    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'reasonsForUseOfForce' }).then(
      ({ section }) => {
        expect(section).to.deep.equal({
          reasons: ['FIGHT_BETWEEN_PRISONERS', 'VERBAL_THREAT', 'REFUSAL_TO_LOCATE_TO_CELL'],
          primaryReason: 'VERBAL_THREAT',
        })
      }
    )
  })

  it('can go back and change primary reason', () => {
    cy.login()

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    {
      const selectUofReasonsPage = reportUseOfForcePage.goToSelectUofReasonsPage()
      selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
      selectUofReasonsPage.checkReason('VERBAL_THREAT')
      selectUofReasonsPage.checkReason('REFUSAL_TO_LOCATE_TO_CELL')
      selectUofReasonsPage.clickSaveAndContinue()
    }
    {
      const selectPrimaryUofReasonPage = SelectPrimaryUofReasonPage.verifyOnPage()
      selectPrimaryUofReasonPage.checkReason('VERBAL_THREAT')
      selectPrimaryUofReasonPage.clickSaveAndContinue()
    }
    UseOfForceDetailsPage.verifyOnPage()

    cy.go('back')
    cy.go('back')

    {
      const selectUofReasonsPage = SelectUofReasonsPage.verifyOnPage()
      selectUofReasonsPage.reasons().then(reasons => {
        expect(reasons).to.deep.equal(['FIGHT_BETWEEN_PRISONERS', 'VERBAL_THREAT', 'REFUSAL_TO_LOCATE_TO_CELL'])
      })
      selectUofReasonsPage.uncheckReason('FIGHT_BETWEEN_PRISONERS')
      selectUofReasonsPage.checkReason('TO_PREVENT_ESCAPE_OR_ABSCONDING')
      selectUofReasonsPage.clickSaveAndContinue()
    }
    {
      const selectPrimaryUofReasonPage = SelectPrimaryUofReasonPage.verifyOnPage()
      selectPrimaryUofReasonPage.primaryReason().should('have.value', 'VERBAL_THREAT')
      selectPrimaryUofReasonPage.checkReason('REFUSAL_TO_LOCATE_TO_CELL')
      selectPrimaryUofReasonPage.clickSaveAndContinue()
    }
    cy.task('getFormSection', { bookingId: offender.bookingId, formName: 'reasonsForUseOfForce' }).then(
      ({ section }) => {
        expect(section).to.deep.equal({
          reasons: ['VERBAL_THREAT', 'REFUSAL_TO_LOCATE_TO_CELL', 'TO_PREVENT_ESCAPE_OR_ABSCONDING'],
          primaryReason: 'REFUSAL_TO_LOCATE_TO_CELL',
        })
      }
    )
  })

  it('can edit from check your answer', () => {
    cy.login()
    cy.task('seedReport', {
      status: ReportStatus.IN_PROGRESS,
      submittedDate: moment().toDate(),
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

    const reportUseOfForcePage = ReportUseOfForcePage.visit(offender.bookingId)
    const checkYourAnswerPage = reportUseOfForcePage.goToAnswerPage()
    checkYourAnswerPage.reasonsForUseOfForce().should('contain', 'Fight between prisoners')
    checkYourAnswerPage.primaryReasonForUseOfForce().should('not.exist')
    checkYourAnswerPage.editUseOfForceDetailsLink().click()

    {
      const selectUofReasonsPage = SelectUofReasonsPage.verifyOnPage()
      selectUofReasonsPage.checkReason('FIGHT_BETWEEN_PRISONERS')
      selectUofReasonsPage.checkReason('VERBAL_THREAT')
      selectUofReasonsPage.checkReason('REFUSAL_TO_LOCATE_TO_CELL')
      selectUofReasonsPage.clickSave()
    }
    {
      const selectPrimaryUofReasonPage = SelectPrimaryUofReasonPage.verifyOnPage()
      selectPrimaryUofReasonPage.checkReason('VERBAL_THREAT')
      selectPrimaryUofReasonPage.clickSaveAndContinue()
    }

    const useOfForceDetailsPage = UseOfForceDetailsPage.verifyOnPage()
    useOfForceDetailsPage.clickSave()

    {
      const checkYourAnswerPage = CheckAnswersPage.verifyOnPage()
      checkYourAnswerPage
        .reasonsForUseOfForce()
        .should('contain', 'Fight between prisoners, Verbal threat, Refusal to locate to cell')
      checkYourAnswerPage.primaryReasonForUseOfForce().should('contain', 'Verbal threat')
    }
  })
})
