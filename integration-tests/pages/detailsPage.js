const page = require('./page')
const relocationAndInjuries = require('./relocationAndInjuriesPage')

export default () =>
  page('Use of force details', {
    fillForm: () => {
      cy.get('[name="positiveCommunication"]').check('yes')
      cy.get('[name="personalProtectionTechniques"]').check('yes')
      cy.get('[name="batonDrawn"]').check('yes')
      cy.get('[name="batonUsed"]').check('yes')
      cy.get('[name="pavaDrawn"]').check('yes')
      cy.get('[name="pavaUsed"]').check('yes')
      cy.get('[name="guidingHold"]').check('yes')
      cy.get('[name="guidingHoldOfficersInvolved"]').check('two')
      cy.get('[name="restraint"]').check('yes')
      cy.get('[name="restraintPositions"]').check(['standing', 'face down (prone)', 'on back (supine)', 'kneeling'])
      cy.get('[name="handcuffsApplied"]').check('yes')
      cy.get('[name="handcuffsType"]').check('ratchet')
    },
    next: () => {
      cy.get('[data-next]').click()
      return relocationAndInjuries()
    },
  })
