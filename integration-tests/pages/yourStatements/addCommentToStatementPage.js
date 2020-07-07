import page from '../page'

const addCommentPage = () =>
  page('Add a comment to your statement', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    statement: () => cy.get('[data-qa=statement]'),
    lastTraining: () => cy.get('[data-qa=last-training]'),
    jobStartYear: () => cy.get('[data-qa=job-start-year]'),
    additionalComment: () => cy.get('[data-qa="additional-comment"]'),
    viewAdditionalComment: index => cy.get(`[data-qa="viewAdditionalComment"][data-loop=${index}]`),

    save: () => cy.get('[data-qa=save]'),
    cancel: () => cy.get('[data-qa=cancel]'),
  })

module.exports = {
  verifyOnPage: addCommentPage,
}
