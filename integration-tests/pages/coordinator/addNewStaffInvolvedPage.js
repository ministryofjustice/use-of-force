import page from '../page'

const addNewStaffInvolved = () =>
  page(`Reason for adding this person`, {
    errorInReportRadio: () => cy.get('[data-qa=error-in-report]'),
    additionalInfo: () => cy.get('[data-qa=additional-info-text]'),
    saveAndContinue: () => cy.get('[data-qa=save-and-continue]'),
  })

module.exports = {
  verifyOnPage: addNewStaffInvolved,
}
