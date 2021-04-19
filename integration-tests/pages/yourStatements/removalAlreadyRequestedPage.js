import page from '../page'

const removalAlreadyRequested = () =>
  page('n/a', {}, () => {
    cy.get('h1').contains('You have already requested to be removed from this use of force incident')
    cy.get('p').contains(
      'The Use of Force Coordinator will review your request and confirm if you have been removed from the incident.'
    )
  })

module.exports = { verifyOnPage: removalAlreadyRequested }
