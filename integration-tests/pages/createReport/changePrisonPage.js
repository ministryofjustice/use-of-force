import page from '../page'

const changePrison = () =>
  page('What prison did the use of force take place in?', {
    prison: () => cy.get('[name="agencyId"]'),
    clickSave: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
  })

module.exports = { verifyOnPage: changePrison }
