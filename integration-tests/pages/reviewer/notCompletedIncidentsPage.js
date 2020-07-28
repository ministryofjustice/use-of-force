import page from '../page'
import tabs from '../sections/incidentTabs'

const row = (type, i) => cy.get(`[data-qa=${type}] tbody tr`).eq(i)
const todoCol = (i, j) => row('incidents-todo', i).find('td').eq(j)

const incidentsPage = () =>
  page('Use of force incidents', {
    ...tabs,
    filter: {
      prisonerName: () => cy.get('[name="prisonerName"]'),
      prisonNumber: () => cy.get('[name="prisonNumber"]'),
      reporter: () => cy.get('[name="reporter"]'),
      dateFrom: () => cy.get('[name="dateFrom"]'),
      dateTo: () => cy.get('[name="dateTo"]'),
      apply: () => cy.get('[data-qa="apply"]'),
      clear: () => cy.get('[data-qa="clear"]'),
    },
    getTodoRows: () => cy.get('[data-qa=incidents-todo]').find('tbody').find('tr'),
    getNoTodoRows: () => cy.get('[data-qa=no-incidents-todo]'),
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

    getCountOfNotCompleteReports: () => {
      return cy.task('getCountOfNotCompleteReports', 'COMPLETE')
    },
  })

module.exports = {
  verifyOnPage: incidentsPage,
  goTo: () => {
    cy.visit('/not-completed-incidents')
    return incidentsPage()
  },
}
