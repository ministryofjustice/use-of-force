import page from '../page'

const useOfForceDetailsPage = () =>
  page('Use of force details', {
    continueButton: () => cy.get('[data-qa="continue-coordinator-edit"]'),
    cancelLink: () => cy.get('[data-qa="cancel-coordinator-edit"]'),
    clickBack: () => cy.get('[data-qa="back-link"]').click(),
    radio: (name, value) => cy.get(`input[name=${name}]`).check(value),
    isCheckedRadio: (name, value) => cy.get(`input[name=${name}][value=${value}]`).should('be.checked'),
    checkBox: id => cy.get(`#${id}`),
  })

module.exports = {
  verifyOnPage: useOfForceDetailsPage,
}
