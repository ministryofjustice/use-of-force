const page = require('./page')
const IncidentsPage = require('./incidentsPage')

const submitStatementPage = () =>
  page('Your statement has been submitted', {
    finish: () => {
      cy.get('[data-qa=finish]').click()
      return IncidentsPage.verifyOnPage()
    },
  })

export default {
  verifyOnPage: submitStatementPage,
}
