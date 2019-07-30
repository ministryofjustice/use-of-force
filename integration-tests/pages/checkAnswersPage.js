const page = require('./page')

const clickSubmit = () => cy.get('[data-submit]').click()

export default () =>
  page('Check your answers before submitting the report', {
    verifyInputs: () => {
      cy.get(':nth-child(3) > :nth-child(1) > .govuk-summary-list__value').contains('Norman Smith')
      cy.get(':nth-child(3) > :nth-child(2) > .govuk-summary-list__value').contains('A1234AC')
      cy.get(':nth-child(3) > :nth-child(3) > .govuk-summary-list__value').contains('ASSO A Wing')
      cy.get(':nth-child(3) > :nth-child(4) > .govuk-summary-list__value').contains('planned')
      cy.get(':nth-child(3) > :nth-child(5) > .govuk-summary-list__value').contains('Mr Zagato, Mrs Jones')
      cy.get(':nth-child(3) > :nth-child(6) > .govuk-summary-list__value').contains('Witness 1, Tom Jones')
      cy.get(':nth-child(5) > :nth-child(1) > .govuk-summary-list__value').contains('Yes')
      cy.get(':nth-child(5) > :nth-child(2) > .govuk-summary-list__value').contains('Yes')
      cy.get(':nth-child(5) > :nth-child(3) > .govuk-summary-list__value').contains('Yes - and used')
      cy.get(':nth-child(5) > :nth-child(4) > .govuk-summary-list__value').contains('Yes - and used')
      cy.get(':nth-child(5) > :nth-child(5) > .govuk-summary-list__value').contains('Yes - two officers involved')
      cy.get('.govuk-grid-column-full > :nth-child(5) > :nth-child(6) > :nth-child(2)').contains(
        'Yes - standing, supine, prone, kneeling'
      )
      cy.get(':nth-child(5) > :nth-child(7) > .govuk-summary-list__value').contains('Yes - ratchet')
      cy.get(':nth-child(7) > :nth-child(1) > .govuk-summary-list__value').contains('segregation unit')
      cy.get(':nth-child(7) > :nth-child(2) > .govuk-summary-list__value').contains('compliant')
      cy.get(':nth-child(7) > :nth-child(3) > .govuk-summary-list__value').contains('Yes - Dr Smith')
      cy.get(':nth-child(7) > :nth-child(4) > .govuk-summary-list__value').contains('Dr Taylor')
      cy.get(':nth-child(7) > :nth-child(5) > .govuk-summary-list__value').contains('Yes')
      cy.get(':nth-child(7) > :nth-child(6) > .govuk-summary-list__value').contains('Yes - Eddie Thomas, Jayne Eyre')
      cy.get(':nth-child(7) > :nth-child(6) > .govuk-summary-list__value').contains('Eddie Thomas, Jayne Eyre')
      cy.get(':nth-child(9) > :nth-child(1) > .govuk-summary-list__value')
        .contains('Bagged evidence 1')
        .contains('This evidence was collected from the prisoner 1')
        .contains('Bagged evidence 2')
        .contains('This evidence was collected from the prisoner 2')
        .contains('Bagged evidence 3')
        .contains('Clothes samples')

      cy.get(':nth-child(9) > :nth-child(2) > .govuk-summary-list__value').contains('Yes')
      cy.get(':nth-child(9) > :nth-child(3) > .govuk-summary-list__value').contains('Not Known')
      cy.get(':nth-child(9) > :nth-child(4) > .govuk-summary-list__value').contains('Yes - 123, 789, 456')
    },
    clickSubmit,
    confirm: () => cy.get('#confirm').click(),
    errorSummary: () => cy.get('#error-summary-title'),
    errorLink: error => cy.get('[data-qa-errors]').contains(error),
    backToTasklist: () => cy.get('[data-qa="return-to-tasklist"]'),
  })
