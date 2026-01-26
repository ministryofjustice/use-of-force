import page from '../page'

const staffInvolvedSearch = () =>
  page(`Find the person you want to add`, {
    username: () => cy.get("[name='username']"),
    searchButton: () => cy.get('[data-qa=search]'),
    getRowAndCol: (row, col) => cy.get(`tr:nth-child(${row}) td:nth-child(${col})`),
  })

module.exports = {
  verifyOnPage: staffInvolvedSearch,
}
