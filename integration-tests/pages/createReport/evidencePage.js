import page from '../page'
import CheckAnswersPage from './checkAnswersPage'

const evidencePage = () =>
  page('Evidence', {
    photosTaken: () => cy.get('[name="photographsTaken"]'),
    fillForm() {
      cy.get('[name="baggedEvidence"]').check('true')
      cy.get('[name="evidenceTagAndDescription[0][evidenceTagReference]"]').type('Bagged evidence 1')
      cy.get('[name="evidenceTagAndDescription[0][description]"]').type(
        'This evidence was collected from the prisoner 1'
      )
      cy.get('[data-qa-add-another-tag = true]').click()
      cy.get('[name="evidenceTagAndDescription[1][evidenceTagReference]"]').type('Bagged evidence 2')
      cy.get('[name="evidenceTagAndDescription[1][description]"]').type(
        'This evidence was collected from the prisoner 2'
      )
      cy.get('[data-qa-add-another-tag = true]').click()
      cy.get('[name="evidenceTagAndDescription[2][evidenceTagReference]"]').type('Bagged evidence 3')
      cy.get('[name="evidenceTagAndDescription[2][description]"]').type('Clothes samples')
      this.photosTaken().check('true')
      cy.get('[name="cctvRecording"]').check('NOT_KNOWN')
      cy.get('[name="bodyWornCamera"]').check('YES')
      cy.get('[name="bodyWornCameraNumbers[0][cameraNum]"]').type('123')
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[1][cameraNum]"]').type('456')
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[2][cameraNum]"]').type('789')
      cy.get('.add-another-camera .add-another__remove-button').eq(1).click()
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[2][cameraNum]"]').type('456')
    },

    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return CheckAnswersPage.verifyOnPage()
    },
    clickSave: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),
  })

module.exports = { verifyOnPage: evidencePage }
