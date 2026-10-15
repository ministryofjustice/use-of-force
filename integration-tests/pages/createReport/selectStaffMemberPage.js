import page from '../page'

const selectStaffMemberPage = () =>
  page('There is more than 1 person with that name', {
    add: username => cy.get(`[data-qa="add-${username}"]`),
    row: username => ({
      username: () => cy.get(`[data-qa="username-${username}"]`),
      prison: () => cy.get(`[data-qa="prison-${username}"]`),
      email: () => cy.get(`[data-qa="email-${username}"]`),
      status: () => cy.get(`[data-qa="status-${username}"]`),
    }),
  })

module.exports = { verifyOnPage: selectStaffMemberPage }
