const page = require('./page')

const row = (type, i) => cy.get(`[data-qa=${type}] tbody tr`).eq(i)

const todoCol = (i, j) =>
  row('statements-todo', i)
    .find('td')
    .eq(j)

const completeCol = (i, j) =>
  row('statements-complete', i)
    .find('td')
    .eq(j)

const myReportsPage = () =>
  page('Use of force incidents', {
    getTodoRow: i => ({
      date: () => todoCol(i, 0),
      prisoner: () => todoCol(i, 1),
      reporter: () => todoCol(i, 2),
      startButton: () => todoCol(i, 3).find('a'),
    }),
    getCompleteRow: i => ({
      date: () => completeCol(i, 0),
      prisoner: () => completeCol(i, 1),
      reporter: () => completeCol(i, 2),
      viewButton: () => completeCol(i, 3).find('a'),
      reportId: () =>
        completeCol(i, 3)
          .find('a')
          .invoke('attr', 'href')
          .then(link => link.match(/\/(.*?)\/your-statement/)[1]),
    }),
    viewStatement: () => cy.get('[data-qa="view-statement"]'),

    selectedTab: () => cy.get('.govuk-tabs__list-item--selected'),
    myReportsTab: () => cy.get('[data-qa="my-reports-link"]'),
  })

export default {
  verifyOnPage: myReportsPage,
  goTo: () => {
    cy.visit('/')
    return myReportsPage()
  },
}
