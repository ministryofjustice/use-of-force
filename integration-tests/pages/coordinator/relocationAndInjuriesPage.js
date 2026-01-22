import page from '../page'

const relocationAndInjuriesPage = () =>
  page('Relocation and injuries', {
    prisonerRelocation: () => cy.get('[name="prisonerRelocation"]'),
    prisonerHospitalisationNo: () => cy.get('#id-prisonerHospitalisation-2'),
    continueButton: () => cy.get('[data-qa="continue-coordinator-edit"]'),
    cancelLink: () => cy.get('[data-qa="cancel-coordinator-edit"]'),
  })

module.exports = {
  verifyOnPage: relocationAndInjuriesPage,
}
