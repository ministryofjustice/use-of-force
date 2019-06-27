const page = require('./page')
const checkAnswersPage = require('./checkAnswersPage')

export default () =>
  page('Evidence', {
    next: () => {
      cy.get('[data-next]').click()
      return checkAnswersPage()
    },
  })
