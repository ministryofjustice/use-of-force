const detailsPage = require('./detailsPage')
const page = require('./page')

export default () =>
  page('New use of force incident', {
    offenderName: () => cy.get('[data-offender-name]'),

    save: () => {
      cy.get('[data-next]').click()
      return detailsPage()
    },
  })
