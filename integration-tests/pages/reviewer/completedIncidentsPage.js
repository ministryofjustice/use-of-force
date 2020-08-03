import page from '../page'
import tabs from '../sections/incidentTabs'
import pagination from '../sections/pagination'

const row = (type, i) => cy.get(`[data-qa=${type}] tbody tr`).eq(i)
const completeCol = (i, j) => row('incidents-complete', i).find('td').eq(j)

const incidentsPage = () =>
  page('Use of force incidents', {
    ...tabs,
    ...pagination,
    filter: {
      prisonerName: () => cy.get('[name="prisonerName"]'),
      prisonNumber: () => cy.get('[name="prisonNumber"]'),
      reporter: () => cy.get('[name="reporter"]'),
      dateFrom: () => cy.get('[name="dateFrom"]'),
      dateTo: () => cy.get('[name="dateTo"]'),
      apply: () => cy.get('[data-qa="apply"]'),
      clear: () => cy.get('[data-qa="clear"]'),
    },

    getCompleteRows: () => cy.get('[data-qa=incidents-complete]').find('tbody').find('tr'),

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

    getNoCompleteRows: () => cy.get('[data-qa="no-incidents-complete"]'),
  })

module.exports = {
  verifyOnPage: incidentsPage,
  goTo: () => {
    cy.visit('/completed-incidents')
    return incidentsPage()
  },
}
