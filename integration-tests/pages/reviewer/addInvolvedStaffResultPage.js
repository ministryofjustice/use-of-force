import page from '../page'

const resultPage = title =>
  page(title, {
    continue: () => cy.get('[data-qa=continue]'),
  })

module.exports = {
  verifyOnPage: resultPage,
}
