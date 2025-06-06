import page from '../page'
import reportDetails from '../sections/reportDetails'

const viewYourReportPage = () =>
  page('Use of force incident', {
    reporterName: () => cy.get('[data-qa="reporter-name"]'),

    submittedDate: () => cy.get('[data-qa="submitted-date"]'),

    prisonerName: () => cy.get('[data-qa="prisoner-name"]'),

    prisonNumber: () => cy.get('[data-qa="prisoner-number"]'),

    incidentNumber: () => cy.get('[data-qa="incident-number"]'),

    deleteInvolvedStaff: username => cy.get(`[data-qa="delete-staff-${username}"]`),

    location: () => cy.get('[data-qa="location"]'),

    batonDrawnLabel: () => cy.get('[data-qa="batonDrawn"]').parent(),

    batonDrawnAgainstPrisonerLabel: () => cy.get('[data-qa="batonDrawnAgainstPrisoner"]').parent(),

    pavaDrawnLabel: () => cy.get('[data-qa="pavaDrawn"]').parent(),

    pavaDrawnAgainstPrisonerLabel: () => cy.get('[data-qa="pavaDrawnAgainstPrisoner"]').parent(),

    verifyInputs: reportDetails.verifyInputs,

    useOfForcePlanned: reportDetails.useOfForcePlanned,

    authorisedBy: reportDetails.authorisedBy,

    getReportId: () => {
      return cy.url().then(url => {
        const match = url.match(/.*\/(.*)\/your-report/)
        return match[1]
      })
    },

    returnToYourReports: () => cy.get('[data-qa="return-to-your-reports"]'),
  })

module.exports = {
  verifyOnPage: viewYourReportPage,
}
