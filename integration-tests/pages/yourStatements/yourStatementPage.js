import page from '../page'

const viewStatementPage = () =>
  page('Your use of force statement', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    statement: () => cy.get('[data-qa=statement]'),
    lastTraining: () => cy.get('[data-qa=last-training]'),
    jobStartYear: () => cy.get('[data-qa=job-start-year]'),
    viewAdditionalComment: index => cy.get(`[data-qa="viewAdditionalComment"][data-loop=${index}]`),

    addComment: () => cy.get('[data-qa="add-comment"]'),
    continue: () => cy.get('[data-qa=continue]'),
  })

module.exports = {
  verifyOnPage: viewStatementPage,
}
