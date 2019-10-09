const page = require('../page')
const reportDetails = require('../sections/reportDetails')

const viewReportPage = () =>
  page('Use of force report', {
    reporterName: () => cy.get('[data-qa="reporter-name"]'),

    submittedDate: () => cy.get('[data-qa="submitted-date"]'),

    prisonerName: () => cy.get('[data-qa="prisoner-name"]'),

    prisonNumber: () => cy.get('[data-qa="prison-number"]'),

    incidentNumber: () => cy.get('[data-qa="incident-number"]'),

    verifyInputs: reportDetails.verifyInputs,

    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*\/(.*)\/view-report/)
        return match[1]
      })
    },

    continue: () => cy.get('[data-qa="continue"]'),
  })

export default {
  verifyOnPage: viewReportPage,
}
