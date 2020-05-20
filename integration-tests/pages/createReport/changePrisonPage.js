const page = require('../page')

const changePrison = () =>
  page('What prison did the use of force take place in?', {
    fillForm() {
      cy.get('[name="agencyId"]').select('LEI')
    },

    clickSave: () => {
      return cy.get('[data-qa="save-and-continue"]').click()
    },

    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
  })

export default { verifyOnPage: changePrison }
