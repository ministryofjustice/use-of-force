const page = require('./page')

const reviewStatementPage = username =>
  page(`${username}'s statement`, {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    statement: () => cy.get('[data-qa=statement]'),
    lastTraining: () => cy.get('[data-qa=last-training]'),
    jobStartYear: () => cy.get('[data-qa=job-start-year]'),
    dateAndTime: () => cy.get('[data-qa=date-and-time]'),
    viewAdditionalComment: index => cy.get(`[data-qa="viewAdditionalComment"][data-loop=${index}]`),

    addComment: () => cy.get('[data-qa="add-comment"]'),
    continue: () => cy.get('[data-qa=continue]'),
  })

export default {
  verifyOnPageForUser: username => reviewStatementPage(username),
}
