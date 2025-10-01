import page from '../page'

const useOfForceDetailsPage = () =>
  page('Use of force details', {
    continueButton: () => cy.get('[data-qa="continue-coordinator-edit"]'),
    cancelLink: () => cy.get('[data-qa="cancel-coordinator-edit"]'),
    radio: (name, value) => cy.get(`input[name=${name}]`).check(value),
    checkBox: id => cy.get(`#${id}`),
  })

module.exports = {
  verifyOnPage: useOfForceDetailsPage,
}
