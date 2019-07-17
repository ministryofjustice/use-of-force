const page = require('./page')
const relocationAndInjuriesPage = require('./relocationAndInjuriesPage')

export default () =>
  page('Use of force details', {
    fillForm: () => {
      cy.get('[name="positiveCommunication"]').check('Yes')
      cy.get('[name="personalProtectionTechniques"]').check('Yes')
      cy.get('[name="batonDrawn"]').check('Yes')
      cy.get('[name="batonUsed"]').check('Yes')
      cy.get('[name="pavaDrawn"]').check('Yes')
      cy.get('[name="pavaUsed"]').check('Yes')
      cy.get('[name="guidingHold"]').check('Yes')
      cy.get('[name="guidingHoldOfficersInvolved"]').check('two')
      cy.get('[name="restraint"]').check('Yes')
      cy.get('[name="restraintPositions"]').check(['standing', 'prone', 'supine', 'kneeling'])
      cy.get('[name="handcuffsApplied"]').check('Yes')
      cy.get('[name="handcuffsType"]').check('ratchet')
    },

    save: () => {
      cy.get('[data-qa="save-and-continue"]').click()
      return relocationAndInjuriesPage()
    },
  })
