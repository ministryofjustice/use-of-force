import page from '../page'

const reportCancelled = () =>
  page('Your report has been cancelled', {
    dpsLink: () => cy.get('[data-qa="exit-to-dps-link"]'),
  })

module.exports = { verifyOnPage: reportCancelled }
