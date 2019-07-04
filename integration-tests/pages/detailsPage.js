const page = require('./page')
const relocationAndInjuries = require('./relocationAndInjuriesPage')

export default () =>
  page('Use of force details', {
    save: () => {
      cy.get('[data-next]').click()
      return relocationAndInjuries()
    },
  })
