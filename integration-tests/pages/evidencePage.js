const page = require('./page')
const checkAnswersPage = require('./checkAnswersPage')

export default () =>
  page('Evidence', {
    fillForm: () => {
      cy.get('[name="baggedEvidence"]').check('yes')
      cy.get('[name="tagNumbers[0][name]"]').type('Bagged evidence 1')
      cy.get('[name="evidenceDescriptions[0][name]"]').type('This evidence was collected from the prsioners cell')
      cy.get('[data-qa-add-another-tag = true]').click()
      cy.get('[name="tagNumbers[1][name]"]').type('Bagged evidence 2')
      cy.get('[name="evidenceDescriptions[1][name]"]').type('This was found outside the canteen')
      cy.get('[data-qa-add-another-tag = true]').click()
      cy.get('[name="tagNumbers[2][name]"]').type('Bagged evidence 3')
      cy.get('[name="evidenceDescriptions[2][name]"]').type('Clothes samples')
      cy.get('[name="photographsTaken"]').check('yes')
      cy.get('[name="cctvRecording"]').check('notKnown')
      cy.get('[name="bodyWornCamera"]').check('yes')
      cy.get('[name="bodyWornCameraNumbers[0][name]"]').type('123')
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[1][name]"]').type('456')
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[2][name]"]').type('789')
      cy.get('.add-another-camera > :nth-child(2) > .govuk-button').click()
      cy.get('[data-qa-add-another-camera = true]').click()
      cy.get('[name="bodyWornCameraNumbers[2][name]"]').type('456')
    },

    save: () => {
      cy.get('[data-next]').click()
      return checkAnswersPage()
    },
  })
