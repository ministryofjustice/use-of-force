import page from '../page'

const prisonPage = () =>
  page('What prison did the use of force take place in?', {
    editReportButton: () => cy.get('[data-qa="button-edit-report"]'),
    selectPrison: () => cy.get('[data-qa="select-prison"]'),
    continueButton: () => cy.get('[data-qa="save-and-continue"]'),
  })

module.exports = {
  verifyOnPage: prisonPage,
}
