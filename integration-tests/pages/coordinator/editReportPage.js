import page from '../page'

const editReportPage = () =>
  page('Edit Use of force report', {
    changeIncidentDetailsLink: () => cy.get('.govuk-\\!-display-none-print [data-qa="incidentDetails-link"]'),
  })

module.exports = {
  verifyOnPage: editReportPage,
}
