const page = require('./page')
const evidencePage = require('./evidencePage')

export default () =>
  page('Relocation and injuries', {
    save: () => {
      cy.get('[data-next]').click()
      return evidencePage()
    },
  })
