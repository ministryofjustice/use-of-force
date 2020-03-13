const page = require('../page')

const addInvolvedStaff = () =>
  page(`Add another member of staff`, {
    username: () => cy.get("[name='username']"),
    saveAndContinue: () => cy.get('[data-qa=continue]'),
  })

export default {
  verifyOnPage: addInvolvedStaff,
}
