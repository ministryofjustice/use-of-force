import page from '../page'

const reportHasBeenDeleted = () =>
  page('This report has been deleted', {
    uofNotCompletedLink: () => cy.get('[data-qa="not-completed-link"]'),
  })

module.exports = { verifyOnPage: reportHasBeenDeleted }
