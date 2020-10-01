import page from '../page'

const staffInvolvedPage = () =>
  page('Staff involved in use of force', {
    noMoreToAdd: () => cy.get('#noMoreToAdd'),
    addAStaffMember: () => cy.get('#confirm'),
    clickSaveAndReturn: () => cy.get('[data-qa="save-and-return"]').click(),
    clickSaveAndContinue: () => cy.get('[data-qa="save-and-continue"]').click(),
    deleteStaff: username => cy.get(`[data-qa="delete-${username}"]`),
    presentStaff: () =>
      cy
        .get('.added-involved-staff')
        .find('.govuk-table__body tr')
        .spread((...rest) =>
          rest.map(element => {
            const tds = Cypress.$(element).find('td.govuk-table__cell')
            return {
              name: Cypress.$(tds[0]).text().trim(),
              emailAddress: Cypress.$(tds[1]).text().trim(),
              canDelete: Cypress.$(tds[2]).find('a').length === 1,
            }
          })
        ),
    saveAndReturn: () => {
      cy.get('[data-qa="save-and-return"]').click()
    },
    cancelButton: () => cy.get('[data-qa="cancel"]'),
    saveButton: () => cy.get('[data-qa="save"]'),
  })

module.exports = { verifyOnPage: staffInvolvedPage }
