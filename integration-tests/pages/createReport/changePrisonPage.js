const page = require('../page')

const changePrison = () =>
  page('What prison did the use of force take place in?', {
    changePrisonToLeeds: () => cy.get('[name="agencyId"]').select('LEI'),
    clickSave: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
  })

export default { verifyOnPage: changePrison }
