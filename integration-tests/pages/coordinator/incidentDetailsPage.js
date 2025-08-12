import page from '../page'

const incidentDetailsPage = () =>
  page('Incident details', {
    cancelLink: () => cy.get('[data-qa="cancel-coordinator-edit"]'),
    changePrisonLink: () => cy.get('[data-qa="change-prison"]'),
    prisonName: () => cy.get('#prison'),
    whereInPrisonLabelText: () => cy.get('[data-qa="prison-label"]'),
    plannedUseOfForceRadioNo: () => cy.get('#plannedUseOfForce-2'),
    continueButton: () => cy.get('[data-qa="continue-coordinator-edit"]'),
  })

module.exports = {
  verifyOnPage: incidentDetailsPage,
}
