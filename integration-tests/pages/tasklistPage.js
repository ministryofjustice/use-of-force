const NewIncidentPage = require('./newIncidentPage')
const CheckAnswersPage = require('./checkAnswersPage')
const UseOfForceDetailsPage = require('./detailsPage')
const page = require('./page')

const tasklistPage = () =>
  page('Report use of force', {
    startNewForm: () => {
      cy.get('[data-qa-new-incident-link]').click()
      return NewIncidentPage.verifyOnPage()
    },
    goToUseOfForceDetailsPage: () => {
      cy.get('[data-qa-details-link]').click()
      return UseOfForceDetailsPage.verifyOnPage()
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
      cy.get(`[data-qa-new-incident=${state.newIncident}]`).should('exist')
      cy.get(`[data-qa-details=${state.details}]`).should('exist')
      cy.get(`[data-qa-relocation-and-injuries=${state.relocationAndInjuries}]`).should('exist')
      cy.get(`[data-qa-evidence=${state.evidence}]`).should('exist')
    },
    checkAllPartsComplete() {
      this.checkParts({
        newIncident: 'COMPLETE',
        details: 'COMPLETE',
        relocationAndInjuries: 'COMPLETE',
        evidence: 'COMPLETE',
      })
    },
    checkNoPartsComplete() {
      this.checkParts({
        newIncident: 'NOT_STARTED',
        details: 'NOT_STARTED',
        relocationAndInjuries: 'NOT_STARTED',
        evidence: 'NOT_STARTED',
      })
    },
  })

export default {
  visit: bookingId => {
    cy.visit(`/report/${bookingId}/report-use-of-force`)
    return tasklistPage()
  },
  verifyOnPage: tasklistPage,
}
