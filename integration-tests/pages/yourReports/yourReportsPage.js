import page from '../page'
import tabs from '../sections/incidentTabs'
import pagination from '../sections/pagination'

const row = i => cy.get(`[data-qa=reports] tbody tr`).eq(i)

const col = (i, j) => row(i).find('td').eq(j)

const yourReportsPage = () =>
  page('Use of force incidents', {
    ...tabs,
    ...pagination,
    getNoRows: () => cy.get('[data-qa=no-reports]'),
    reports: i => ({
      date: () => col(i, 0),
      prisoner: () => col(i, 1),
      prisonNumber: () => col(i, 2),
      action: () => col(i, 3).find('a'),
      reportId: () =>
        col(i, 3)
          .find('a')
          .invoke('attr', 'href')
          .then(link => link.match(/\/(.*?)\/your-statement/)[1]),
    }),
  })

module.exports = {
  verifyOnPage: yourReportsPage,
  goTo: () => {
    cy.visit('/your-reports')
    return yourReportsPage()
  },
}
