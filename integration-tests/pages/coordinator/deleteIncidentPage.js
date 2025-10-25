import page from '../page'

const deleteIncidentPage = reportId => {
  if (reportId) {
    cy.visit(`/${reportId}/delete-incident`)
  }
  return page('Delete use of force incident', {
    form: () => cy.get('[data-qa="delete-incident-form"], form'),
    yesRadio: () => cy.get('[data-qa="delete-incident-yes"], input[type="radio"][value="yes"]'),
    noRadio: () => cy.get('[data-qa="delete-incident-no"], input[type="radio"][value="no"]'),
    continueButton: () => cy.get('[data-qa="delete-incident-continue"], button[type="submit"]'),
    errorSummary: () => cy.get('[data-qa="error-summary"], .govuk-error-summary'),
    backLink: () => cy.get('[data-qa="back-link"], a.govuk-back-link'),
  })
}

module.exports = {
  verifyOnPage: () => deleteIncidentPage(),
  goTo: reportId => deleteIncidentPage(reportId),
}
