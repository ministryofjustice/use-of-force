const page = require('./page')
const relocationAndInjuriesPage = require('./relocationAndInjuriesPage')

export default () =>
  page('Use of force details', {
    fillForm: () => {
      cy.get('[name="positiveCommunication"]').check('true')
      cy.get('[name="personalProtectionTechniques"]').check('true')
      cy.get('[name="batonDrawn"]').check('true')
      cy.get('[name="batonUsed"]').check('true')
      cy.get('[name="pavaDrawn"]').check('true')
      cy.get('[name="pavaUsed"]').check('true')
      cy.get('[name="guidingHold"]').check('true')
      cy.get('[name="guidingHoldOfficersInvolved"]').check('2')
      cy.get('[name="restraint"]').check('true')
      cy.get('[name="restraintPositions"]').check(['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'])
      cy.get('[name="handcuffsApplied"]').check('true')
      cy.get('[name="handcuffsType"]').check('RATCHET')
    },

    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return relocationAndInjuriesPage()
    },
  })
