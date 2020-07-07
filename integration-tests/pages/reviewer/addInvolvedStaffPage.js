import page from '../page'

const addInvolvedStaff = () =>
  page(`Add another member of staff`, {
    username: () => cy.get("[name='username']"),
    saveAndContinue: () => cy.get('[data-qa=continue]'),
  })

module.exports = {
  verifyOnPage: addInvolvedStaff,
}
