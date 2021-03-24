import NewIncidentPage from './incidentDetailsPage'
import CheckAnswersPage from './checkAnswersPage'
import SelectUofReasonsPage from './selectUofReasonsPage'
import StaffInvolvedPage from './staffInvolvedPage'
import page from '../page'

const tasklistPage = () =>
  page('Report use of force', {
    startNewForm: () => {
      cy.get('[data-qa-incident-details-link]').click()
      return NewIncidentPage.verifyOnPage()
    },
    goToSelectUofReasonsPage: () => {
      cy.get('[data-qa-use-of-force-details-link]').click()
      return SelectUofReasonsPage.verifyOnPage()
    },
    goToInvolvedStaffPage: () => {
      cy.get('[data-qa-staff-involved-link]').click()
      return StaffInvolvedPage.verifyOnPage()
    },
    checkYourAnswersLink: () => cy.get('[data-qa-check-answers-link]'),
    goToAnswerPage() {
      this.checkYourAnswersLink().click()
      return CheckAnswersPage.verifyOnPage()
    },
    offenderName: () => cy.get('[data-qa="offender-name"]'),
    nomisId: () => cy.get('[data-qa="nomis-id"]'),
    dob: () => cy.get('[data-qa="dob"]'),
    offenderImage: () => cy.get('[data-qa="offender-image"]'),

    checkParts: state => {
      cy.get(`[data-qa-incident-details=${state.incidentDetails}]`).should('exist')
      cy.get(`[data-qa-staff-involved=${state.staffInvolved}]`).should('exist')
      cy.get(`[data-qa-use-of-force-details=${state.useOfForceDetails}]`).should('exist')
      cy.get(`[data-qa-relocation-and-injuries=${state.relocationAndInjuries}]`).should('exist')
      cy.get(`[data-qa-evidence=${state.evidence}]`).should('exist')
    },
    checkAllPartsComplete() {
      this.checkParts({
        incidentDetails: 'COMPLETE',
        staffInvolved: 'COMPLETE',
        useOfForceDetails: 'COMPLETE',
        relocationAndInjuries: 'COMPLETE',
        evidence: 'COMPLETE',
      })
    },
    checkNoPartsComplete() {
      this.checkParts({
        incidentDetails: 'NOT_STARTED',
        staffInvolved: 'NOT_STARTED',
        useOfForceDetails: 'NOT_STARTED',
        relocationAndInjuries: 'NOT_STARTED',
        evidence: 'NOT_STARTED',
      })
    },
  })

module.exports = {
  visit: bookingId => {
    cy.visit(`/report/${bookingId}/report-use-of-force`)
    return tasklistPage()
  },
  verifyOnPage: tasklistPage,
}
