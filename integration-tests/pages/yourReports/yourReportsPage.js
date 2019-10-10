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

const yourReportsPage = () =>
  page('Use of force incidents', {
    ...tabs,
    getTodoRow: i => ({
      date: () => todoCol(i, 0),
      prisoner: () => todoCol(i, 1),
      startButton: () => todoCol(i, 2).find('a'),
    }),
    getCompleteRow: i => ({
      date: () => completeCol(i, 0),
      prisoner: () => completeCol(i, 1),
      viewButton: () => completeCol(i, 2).find('a'),
      reportId: () =>
        completeCol(i, 3)
          .find('a')
          .invoke('attr', 'href')
          .then(link => link.match(/\/(.*?)\/your-statement/)[1]),
    }),
  })

export default {
  verifyOnPage: yourReportsPage,
  goTo: () => {
    cy.visit('/')
    return yourReportsPage()
  },
}
