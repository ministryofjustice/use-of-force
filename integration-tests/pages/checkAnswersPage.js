const page = require('./page')

const clickSubmit = () => cy.get('[data-submit]').click()

export default () =>
  page('Check your answers before submitting the report', {
    verifyInputs: () => {
      cy.get('.govuk-grid-column-full > :nth-child(2) > :nth-child(2) > :nth-child(2)').contains('Norman Smith')
      cy.get('.govuk-grid-column-full > :nth-child(2) > :nth-child(3) > :nth-child(2)').contains('A1234AC')
      cy.get('.govuk-grid-column-full > :nth-child(2) > :nth-child(4) > :nth-child(2)').contains('ASSO A Wing')
      cy.get('.govuk-grid-column-full > :nth-child(2) > :nth-child(5) > :nth-child(2)').contains('planned')
      cy.get('.govuk-grid-column-full > :nth-child(2) > :nth-child(6) > :nth-child(2)').contains('Mr Zagato, Mrs Jones')
      cy.get('.govuk-grid-column-full > :nth-child(2) > :nth-child(7) > :nth-child(2)').contains('Witness 1, Tom Jones')
      cy.get('.govuk-grid-column-full > :nth-child(3) > :nth-child(2) > :nth-child(2)').contains('Yes')
      cy.get('.govuk-grid-column-full > :nth-child(3) > :nth-child(3) > :nth-child(2)').contains('Yes')
      cy.get('.govuk-grid-column-full > :nth-child(3) > :nth-child(4) > :nth-child(2)').contains('Yes - and used')
      cy.get('.govuk-grid-column-full > :nth-child(3) > :nth-child(5) > :nth-child(2)').contains('Yes - and used')
      cy.get('.govuk-grid-column-full > :nth-child(3) > :nth-child(6) > :nth-child(2)').contains(
        'Yes - two officers involved'
      )
      cy.get('.govuk-grid-column-full > :nth-child(3) > :nth-child(7) > :nth-child(2)').contains(
        'Yes - standing, supine, prone, kneeling'
      )
      cy.get('.govuk-grid-column-full > :nth-child(3) > :nth-child(8) > :nth-child(2)').contains('Yes - ratchet')
      cy.get('.govuk-grid-column-full > :nth-child(4) > :nth-child(2) > :nth-child(2)').contains('segregation unit')
      cy.get('.govuk-grid-column-full > :nth-child(4) > :nth-child(3) > :nth-child(2)').contains('compliant')
      cy.get('.govuk-grid-column-full > :nth-child(4) > :nth-child(4) > :nth-child(2)').contains('Yes - Dr Smith')
      cy.get('.govuk-grid-column-full > :nth-child(4) > :nth-child(5) > :nth-child(2)').contains('Dr Taylor')
      cy.get('.govuk-grid-column-full > :nth-child(4) > :nth-child(6) > :nth-child(2)').contains('Yes')
      cy.get('.govuk-grid-column-full > :nth-child(4) > :nth-child(7) > :nth-child(2)').contains(
        'Yes - Eddie Thomas, Jayne Eyre'
      )
      cy.get('.govuk-grid-column-full > :nth-child(4) > :nth-child(8) > :nth-child(2)').contains(
        'Eddie Thomas, Jayne Eyre'
      )
      cy.get('.govuk-grid-column-full > :nth-child(5) > :nth-child(2) > :nth-child(2)')
        .contains('Bagged evidence 1')
        .contains('This evidence was collected from the prisoner 1')

        .contains('Bagged evidence 2')
        .contains('This evidence was collected from the prisoner 2')
        .contains('Bagged evidence 3')
        .contains('Clothes samples')

      cy.get('.govuk-grid-column-full > :nth-child(5) > :nth-child(3) > :nth-child(2)').contains('Yes')
      cy.get('.govuk-grid-column-full > :nth-child(5) > :nth-child(4) > :nth-child(2)').contains('Not Known')
      cy.get('.govuk-grid-column-full > :nth-child(5) > :nth-child(5) > :nth-child(2)').contains('Yes - 123, 789, 456')
    },
    clickSubmit,
    confirm: () => cy.get('#confirm').click(),
    errorSummary: () => cy.get('#error-summary-title'),
    errorLink: error => cy.get('[data-qa-errors]').contains(error),
    backToTasklist: () => cy.get('[data-qa="return-to-tasklist"]'),
  })
