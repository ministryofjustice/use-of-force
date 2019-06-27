const page = require('./page')
const submittedPage = require('./submittedPage')

export default () =>
  page('Check your answers before submitting the report', {
    submit: () => {
      cy.get('[data-submit]').click()
      return submittedPage()
    },
  })
