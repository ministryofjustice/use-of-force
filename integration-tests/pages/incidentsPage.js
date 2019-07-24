const page = require('./page')

const row = i => cy.get('.todo-incidents tbody tr').eq(i)

const incidentsPage = () =>
  page('Use of force incidents', {
    getTodoRow: i => [
      () =>
        row(i)
          .find('td')
          .eq(0),
      () =>
        row(i)
          .find('td')
          .eq(1),
      () =>
        row(i)
          .find('td')
          .eq(2),
    ],
  })

export default {
  verifyOnPage: incidentsPage,
}
