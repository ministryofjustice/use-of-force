const page = require('../page')
const reportDetails = require('../sections/reportDetails')

const viewYourReportPage = () =>
  page('Use of force report', {
    reporterName: () => cy.get('[data-qa="reporter-name"]'),

    submittedDate: () => cy.get('[data-qa="submitted-date"]'),

    prisonerName: () => cy.get('[data-qa="prisoner-name"]'),

    prisonNumber: () => cy.get('[data-qa="prisoner-number"]'),

    incidentNumber: () => cy.get('[data-qa="incident-number"]'),

    verifyInputs: reportDetails.verifyInputs,

    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*\/(.*)\/your-report/)
        return match[1]
      })
    },

    returnToYourReports: () => cy.get('[data-qa="return-to-your-reports"]'),
  })

export default {
  verifyOnPage: viewYourReportPage,
}
