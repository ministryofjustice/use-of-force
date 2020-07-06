import page from '../page'
import reportDetails from '../sections/reportDetails'

const clickSubmit = () => cy.get('[data-submit]').click()

const checkAnswersPage = () =>
  page('Check your answers before sending the report', {
    editIncidentDetailsLink: () => cy.get('[data-qa="incidentDetails-link"'),
    editUseOfForceDetailsLink: () => cy.get('[data-qa="useOfForceDetails-link"'),
    editRelocationAndInjuriesLink: () => cy.get('[data-qa="relocationAndInjuries-link"'),
    editEvidenceLink: () => cy.get('[data-qa="evidence-link"'),

    useOfForcePlanned: reportDetails.useOfForcePlanned,
    positiveCommunicationUsed: reportDetails.positiveCommunicationUsed,
    handcuffsApplied: reportDetails.handcuffsApplied,
    painInducingTechniques: reportDetails.painInducingTechniques,
    prisonerCompliant: reportDetails.prisonerCompliant,
    photosTaken: reportDetails.photosTaken,
    verifyInputs: reportDetails.verifyInputs,
    prison: reportDetails.prison,

    clickSubmit,
    backToTasklist: () => cy.get('[data-qa="return-to-tasklist"]'),
  })

module.exports = { verifyOnPage: checkAnswersPage }
