import page from '../page'

const alreadyRemovedPage = () =>
  page('n/a', {}, () => {
    cy.get('h1').contains('Your request has been submitted')
    cy.get('p').contains('You no longer need to complete a statement')
  })

module.exports = { verifyOnPage: alreadyRemovedPage }
