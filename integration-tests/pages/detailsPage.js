const page = require('./page')
const relocationAndInjuries = require('./relocationAndInjuriesPage')

export default () =>
  page('Use of force details', {
    next: () => {
      cy.get('[data-next]').click()
      return relocationAndInjuries()
    },
  })
