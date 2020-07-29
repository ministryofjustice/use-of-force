module.exports = {
  allTabs: () =>
    cy.get(`.govuk-tabs__list-item`).spread((...rest) => rest.map(element => Cypress.$(element).text().trim())),
  selectedTab: () => cy.get('.govuk-tabs__list-item--selected'),
  completedIncidentsTab: () => cy.get('[data-qa="completed-link"]'),
  notCompletedIncidentsTab: () => cy.get('[data-qa="not-completed-link"]'),
  yourReportsTab: () => cy.get('[data-qa="your-reports-link"]'),
  yourStatementsTab: () => cy.get('[data-qa="your-statements-link"]'),
  reportInAnotherPrisonLink: () => cy.get('[data-qa="report-in-another-prison-link"]'),
  exitLink: () => cy.get('[data-qa=exit-to-dps-link').invoke('attr', 'href'),
}
