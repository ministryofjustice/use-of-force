import page from '../page'
import CheckAnswersPage from './checkAnswersPage'

const evidencePage = () =>
  page('Evidence', {
    photosTaken: () => cy.get('[name="photographsTaken"]'),
    fillForm() {
      cy.get('[name="baggedEvidence"]').check('true')
      cy.get('[name="evidenceTagAndDescription[0][evidenceTagReference]"]').type('Bagged evidence 1')
      cy.get('[name="evidenceTagAndDescription[0][description]"]').type(
        'This evidence was collected from the prisoner 1',
      )
      cy.get('[data-qa-add-another-tag = true]').click()
      cy.get('[name="evidenceTagAndDescription[1][evidenceTagReference]"]').type('Bagged evidence 2')
      cy.get('[name="evidenceTagAndDescription[1][description]"]').type(
        'This evidence was collected from the prisoner 2',
      )
      cy.get('[data-qa-add-another-tag = true]').click()
      cy.get('[name="evidenceTagAndDescription[2][evidenceTagReference]"]').type('Bagged evidence 3')
      cy.get('[name="evidenceTagAndDescription[2][description]"]').type('Clothes samples')
      this.photosTaken().check('true')
      cy.get('[name="cctvRecording"]').check('NOT_KNOWN')
    },

    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return CheckAnswersPage.verifyOnPage()
    },
    clickSave: () => cy.get('[data-qa="save"]').click(),
    clickSaveAndContinue: () => cy.get('[data-qa="save"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
  })

module.exports = { verifyOnPage: evidencePage }
