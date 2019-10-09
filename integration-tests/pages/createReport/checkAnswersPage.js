const page = require('../page')
const reportDetails = require('../sections/reportDetails')

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
    prisonerCompliant: reportDetails.prisonerCompliant,
    photosTaken: reportDetails.photosTaken,
    verifyInputs: reportDetails.verifyInputs,

    clickSubmit,
    backToTasklist: () => cy.get('[data-qa="return-to-tasklist"]'),
  })

export default { verifyOnPage: checkAnswersPage }
