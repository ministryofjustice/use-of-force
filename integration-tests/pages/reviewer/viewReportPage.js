import page from '../page'
import reportDetails from '../sections/reportDetails'

const viewReportPage = () =>
  page('Use of force incident', {
    reporterName: () => cy.get('[data-qa="report-created-by"]'),

    submittedDate: () => cy.get('[data-qa="submitted-date"]'),

    prisonerName: () => cy.get('[data-qa="prisoner-name"]'),

    prisonNumber: () => cy.get('[data-qa="prisoner-number"]'),

    incidentNumber: () => cy.get('[data-qa="incident-number"]'),

    verifyInputs: reportDetails.verifyInputs,

    deleteInvolvedStaff: username => cy.get(`[data-qa="delete-staff-${username}"]`),

    addInvolvedStaff: () => cy.get(`[data-qa="add-staff"]`),

    prison: () => cy.get('[data-qa="prison"]'),

    location: () => cy.get('[data-qa="location"]'),

    historyLink: () => cy.get('[data-qa="history-link"]'),

    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*\/(.*)\/view-report/)
        return match[1]
      })
    },

    returnToIncidentOverview: () => cy.get('[data-qa="return-to-incident-overview"]'),
  })

module.exports = {
  verifyOnPage: viewReportPage,
}
