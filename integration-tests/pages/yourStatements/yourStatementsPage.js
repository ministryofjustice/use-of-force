const page = require('../page')
const tabs = require('../sections/incidentTabs')

const row = (type, i) => cy.get(`[data-qa=${type}] tbody tr`).eq(i)

const todoCol = (i, j) =>
  row('statements-todo', i)
    .find('td')
    .eq(j)

const completeCol = (i, j) =>
  row('statements-complete', i)
    .find('td')
    .eq(j)

const yourStatementsPage = () =>
  page('Use of force incidents', {
    ...tabs,
    getTodoRow: i => ({
      date: () => todoCol(i, 0),
      prisoner: () => todoCol(i, 1),
      prisonNumber: () => todoCol(i, 2),
      reporter: () => todoCol(i, 3),
      startButton: () => todoCol(i, 4).find('a'),
    }),
    getCompleteRow: i => ({
      date: () => completeCol(i, 0),
      prisoner: () => completeCol(i, 1),
      prisonNumber: () => completeCol(i, 2),
      reporter: () => completeCol(i, 3),
      viewButton: () => completeCol(i, 4).find('a'),
      reportId: () =>
        completeCol(i, 4)
          .find('a')
          .invoke('attr', 'href')
          .then(link => link.match(/\/(.*?)\/your-statement/)[1]),
    }),
  })

export default {
  verifyOnPage: yourStatementsPage,
  goTo: () => {
    cy.visit('/your-statements')
    return yourStatementsPage()
  },
}
