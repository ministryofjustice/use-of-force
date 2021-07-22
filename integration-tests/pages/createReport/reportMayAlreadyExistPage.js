import page from '../page'

const reportMayAlreadyExist = () =>
  page('A report for this incident may already exist', {
    offenderName: () => cy.get('[data-qa="offender-name"]'),
    table: () => cy.get('[data-qa="table"]').find('tbody').find('tr'),
    date: () => cy.get(`[data-qa="table"] tbody tr td`).eq(0),
    location: () => cy.get(`[data-qa="table"] tbody tr td`).eq(1),
    reporter: () => cy.get(`[data-qa="table"] tbody tr td`).eq(2),
    cancelReportYesRadio: () => cy.get('[data-qa="yes"]'),
    cancelReportNoRadio: () => cy.get('[data-qa="no"]'),
    saveAndContinueButton: () => cy.get('[data-qa="save-and-continue"]'),
  })

module.exports = { verifyOnPage: reportMayAlreadyExist }
