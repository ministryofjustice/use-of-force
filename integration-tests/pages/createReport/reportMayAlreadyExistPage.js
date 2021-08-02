import page from '../page'

const row = i => cy.get(`[data-qa="table"] tbody tr`).eq(i)
const col = (i, j) => row(i).find('td').eq(j)

const reportMayAlreadyExist = () =>
  page('A report for this incident may already exist', {
    offenderName: () => cy.get('[data-qa="offender-name"]'),
    getRow: i => ({
      dateTime: () => col(i, 0),
      location: () => col(i, 1),
      reporter: () => col(i, 2),
    }),
    getRows: () => cy.get('[data-qa=table]').find('tbody').find('tr'),
    cancelReport: () => cy.get('[data-qa="yes"]'),
    continueReport: () => cy.get('[data-qa="no"]'),
    saveAndContinue: () => cy.get('[data-qa="save-and-continue"]'),
  })

module.exports = { verifyOnPage: reportMayAlreadyExist }
