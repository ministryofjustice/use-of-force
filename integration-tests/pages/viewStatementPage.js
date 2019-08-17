const page = require('./page')

const viewStatementPage = () =>
  page('Use of force statement - review', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    statement: () => cy.get('[data-qa=statement]'),
    lastTraining: () => cy.get('[data-qa=last-training]'),
    jobStartYear: () => cy.get('[data-qa=job-start-year]'),

    cancel: () => cy.get('[data-qa=cancel]'),
  })

export default {
  verifyOnPage: viewStatementPage,
}
