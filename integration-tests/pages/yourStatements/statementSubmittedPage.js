import page from '../page'
import IncidentsPage from './yourStatementsPage'

const submitStatementPage = () =>
  page('Your statement has been submitted', {
    finish: () => {
      cy.get('[data-qa=finish]').click()
      return IncidentsPage.verifyOnPage()
    },
  })

module.exports = {
  verifyOnPage: submitStatementPage,
}
