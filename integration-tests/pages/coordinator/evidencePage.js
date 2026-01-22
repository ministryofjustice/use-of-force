import page from '../page'

const evidencePage = () =>
  page('Evidence', {
    baggedEvidenceYes: () => cy.get('#baggedEvidence'),
    baggedEvidenceNo: () => cy.get('#bagged-evidence-no'),
    evidenceTag: index => cy.get(`input[name="evidenceTagAndDescription[${index}][evidenceTagReference]"]`),
    evidenceTagDescription: index => cy.get(`textarea[name="evidenceTagAndDescription[${index}][description]"]`),
    photographsTakenYes: () => cy.get('#photographsTaken'),
    photographsTakenNo: () => cy.get('#photographsTaken-2'),
    cctvNo: () => cy.get('#cctvRecording-2'),
    cctvNotKnown: () => cy.get('#cctvRecording-3'),
    continueButton: () => cy.get('[data-qa="continue-coordinator-edit"]'),
    cancelLink: () => cy.get('[data-qa="cancel-coordinator-edit"]'),
  })

module.exports = {
  verifyOnPage: evidencePage,
}
