import page from '../page'

const staffMemberNotRemovedPage = () =>
  page('Staff member not removed', {
    name: () => cy.get('[data-qa=name]'),
    emailAddress: () => cy.get('[data-qa=email]'),

    return: () => cy.get('[data-qa=return-to-incident]'),
  })

module.exports = {
  verifyOnPage: staffMemberNotRemovedPage,
}
