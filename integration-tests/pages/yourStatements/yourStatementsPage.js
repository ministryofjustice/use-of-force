import page from '../page'
import tabs from '../sections/incidentTabs'
import pagination from '../sections/pagination'

const row = (type, i) => cy.get(`[data-qa=${type}] tbody tr`).eq(i)

const col = (i, j) => row('statements', i).find('td').eq(j)

const yourStatementsPage = () =>
  page('Use of force incidents', {
    ...pagination,
    ...tabs,
    statements: i => ({
      date: () => col(i, 0),
      prisoner: () => col(i, 1),
      prisonNumber: () => col(i, 2),
      reporter: () => col(i, 3),
      action: () => col(i, 4).find('a'),
      overdue: () => col(i, 5).find('[data-qa=overdue]'),
      removalRequested: () => col(i, 5).find('[data-qa=removal-request]'),
      reportId: () =>
        col(i, 4)
          .find('a')
          .invoke('attr', 'href')
          .then(link => link.match(/\/(.*?)\/your-statement/)[1]),
    }),
    loggedInName: () => cy.get('[data-qa=header-user-name]'),
  })

module.exports = {
  verifyOnPage: yourStatementsPage,
  goTo: () => {
    cy.visit('/your-statements')
    return yourStatementsPage()
  },
}
