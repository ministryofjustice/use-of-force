const page = require('../page')
const RelocationAndInjuriesPage = require('./relocationAndInjuriesPage')

const useOfForceDetailsPage = () =>
  page('Use of force details', {
    postiveCommunication: () => cy.get('[name="positiveCommunication"]'),
    personalProtectionTechniques: () => cy.get('[name="personalProtectionTechniques"]'),
    batonDrawn: () => cy.get('[name="batonDrawn"]'),
    batonUsed: () => cy.get('[name="batonUsed"]'),
    pavaDrawn: () => cy.get('[name="pavaDrawn"]'),
    pavaUsed: () => cy.get('[name="pavaUsed"]'),
    guidingHold: () => cy.get('[name="guidingHold"]'),

    guidingHoldOfficersInvolved: {
      check: value => cy.get('[name="guidingHoldOfficersInvolved"]').check(value),
      one: () => cy.get('[name="guidingHoldOfficersInvolved"][value="1"]'),
      two: () => cy.get('[name="guidingHoldOfficersInvolved"][value="2"]'),
    },

    restraintPositions: {
      check: value => cy.get('#control-and-restraint [type="checkbox"]').check(value),
      standing: () => cy.get('#control-and-restraint [type="checkbox"][value="STANDING"]'),
      onBack: () => cy.get('#control-and-restraint [type="checkbox"][value="ON_BACK"]'),
      faceDown: () => cy.get('#control-and-restraint [type="checkbox"][value="FACE_DOWN"]'),
      kneeling: () => cy.get('#control-and-restraint [type="checkbox"][value="KNEELING"]'),
    },

    restraint: () => cy.get('[name="restraint"]'),
    handcuffsApplied: () => cy.get('[name="handcuffsApplied"]'),
    painInducingTechniques: () => cy.get('[name="painInducingTechniques"]'),

    fillForm() {
      this.postiveCommunication().check('true')
      this.personalProtectionTechniques().check('true')
      this.batonDrawn().check('true')
      this.batonUsed().check('true')
      this.pavaDrawn().check('true')
      this.pavaUsed().check('true')
      this.guidingHold().check('true')
      this.guidingHoldOfficersInvolved.check('2')
      this.restraint().check('true')
      this.restraintPositions.check(['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'])
      this.handcuffsApplied().check('true')
      this.painInducingTechniques().check('true')
    },

    errorSummary() {
      return cy.get('.govuk-error-summary')
    },

    clickSave: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),

    save() {
      this.clickSave()
      return RelocationAndInjuriesPage.verifyOnPage()
    },

    saveAndReturnToUseOfForce() {
      return cy.get('[data-qa="save-and-return"]').click()
    },
  })

export default { verifyOnPage: useOfForceDetailsPage }
