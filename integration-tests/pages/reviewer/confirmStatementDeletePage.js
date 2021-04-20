import page from '../page'

const confirmStatementDelete = name =>
  page(`Are you sure you want to delete ${name}?`, {
    continue: () => cy.get('[data-qa=continue]'),
    confirm: () => cy.get('[name="confirm"]').check('yes'),
    refuse: () => cy.get('[name="confirm"]').check('no'),
  })

module.exports = {
  verifyOnPage: confirmStatementDelete,
}
