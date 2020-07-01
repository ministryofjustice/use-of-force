const page = require('../page')
const tabs = require('../sections/incidentTabs')

const row = (type, i) => cy.get(`[data-qa=${type}] tbody tr`).eq(i)

const todoCol = (i, j) =>
  row('incidents-todo', i)
    .find('td')
    .eq(j)

const completeCol = (i, j) =>
  row('incidents-complete', i)
    .find('td')
    .eq(j)

const incidentsPage = () =>
  page('Use of force incidents', {
    ...tabs,
    filter: {
      prisonNumber: () => cy.get('[name="prisonNumber"]'),
      reporter: () => cy.get('[name="reporter"]'),
      dateFrom: () => cy.get('[name="dateFrom"]'),
      dateTo: () => cy.get('[name="dateTo"]'),
      apply: () => cy.get('[data-qa="apply"]'),
    },
    getTodoRows: () =>
      cy
        .get('[data-qa=incidents-todo]')
        .find('tbody')
        .find('tr'),
    getNoTodoRows: () => cy.get('[data-qa=no-incidents-todo]'),
    getCompleteRows: () =>
      cy
        .get('[data-qa=incidents-complete]')
        .find('tbody')
        .find('tr'),
    getNoCompleteRows: () => cy.get('[data-qa=no-incidents-complete]'),
    getTodoRow: i => ({
      row: () => cy.get('[data-qa=incidents-todo]'),
      date: () => todoCol(i, 0),
      prisoner: () => todoCol(i, 1),
      prisonNumber: () => todoCol(i, 2),
      reporter: () => todoCol(i, 3),
      viewStatementsButton: () => todoCol(i, 4).find('a'),
      overdue: () => cy.get('[data-qa=overdue]'),
      reportId: () =>
        todoCol(i, 4)
          .find('a')
          .invoke('attr', 'href')
          .then(link => link.match(/\/(.*?)\/view-statements/)[1]),
    }),

    getCompleteRow: i => ({
      date: () => completeCol(i, 0),
      prisoner: () => completeCol(i, 1),
      prisonNumber: () => completeCol(i, 2),
      reporter: () => completeCol(i, 3),
      viewStatementsButton: () => completeCol(i, 4).find('a'),
      reportId: () =>
        completeCol(i, 4)
          .find('a')
          .invoke('attr', 'href')
          .then(link => link.match(/\/(.*?)\/your-statement/)[1]),
    }),
  })

export default {
  verifyOnPage: incidentsPage,
  goTo: () => {
    cy.visit('/all-incidents')
    return incidentsPage()
  },
}
