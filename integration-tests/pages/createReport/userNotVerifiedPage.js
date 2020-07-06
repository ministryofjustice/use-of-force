import page from '../page'

const userNotVerifiedPage = username =>
  page(`${username} name has not verified their email address`, {
    continue: () => cy.get('[data-qa=continue]'),
  })

module.exports = {
  verifyOnPage: userNotVerifiedPage,
}
