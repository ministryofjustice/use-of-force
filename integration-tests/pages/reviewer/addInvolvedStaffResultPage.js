const page = require('../page')

const resultPage = title =>
  page(title, {
    continue: () => cy.get('[data-qa=continue]'),
  })

export default {
  verifyOnPage: resultPage,
}
