import page from '../page'

const evidencePage = () =>
  page('Evidence', {
    baggedEvidenceYes: () => cy.get('#baggedEvidence'),
    baggedEvidenceNo: () => cy.get('#bagged-evidence-no'),
    evidenceTag: index => cy.get(`[data-qa=evidenceTagAndDescription[${index}][evidenceTagReference]`),
    photographsTakenNo: () => cy.get('#photographsTaken-2'),
    cctvNo: () => cy.get('#cctvRecording-2'),
    continueButton: () => cy.get('[data-qa="continue-coordinator-edit"]'),
    cancelLink: () => cy.get('[data-qa="cancel-coordinator-edit"]'),
  })

module.exports = {
  verifyOnPage: evidencePage,
}
