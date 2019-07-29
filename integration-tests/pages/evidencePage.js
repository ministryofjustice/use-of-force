const page = require('./page')
const checkAnswersPage = require('./checkAnswersPage')

export default () =>
  page('Evidence', {
    fillForm: () => {
      cy.get('[name="baggedEvidence"]').check('Yes')
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
      cy.get('[name="photographsTaken"]').check('Yes')
      cy.get('[name="cctvRecording"]').check('Not Known')
      cy.get('[name="bodyWornCamera"]').check('Yes')
      cy.get('[name="bodyWornCameraNumbers[0][cameraNum]"]').type('123')
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[1][cameraNum]"]').type('456')
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[2][cameraNum]"]').type('789')
      cy.get('.add-another-camera > :nth-child(2) > .govuk-button').click()
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[2][cameraNum]"]').type('456')
    },

    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return checkAnswersPage()
    },
  })
