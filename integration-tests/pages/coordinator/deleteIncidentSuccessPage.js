import { alternativeComponentToTitle } from '../page'

const DeleteIncidentSuccessPage = () =>
  alternativeComponentToTitle('You have deleted use of force incident', '.govuk-panel__body', {
    viewIncidentsLink: () => cy.get('[data-qa="view-incidents"]'),
  })

module.exports = {
  verifyOnPage: DeleteIncidentSuccessPage,
}
