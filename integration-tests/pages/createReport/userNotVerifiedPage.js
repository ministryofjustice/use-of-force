const page = require('../page')

const userNotVerifiedPage = username =>
  page(`${username} name has not verified their email address`, {
    continue: () => cy.get('[data-qa=continue]'),
  })

export default {
  verifyOnPage: userNotVerifiedPage,
}
