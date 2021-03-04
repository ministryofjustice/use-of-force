import page from '../page'
import RelocationAndInjuriesPage from './relocationAndInjuriesPage'

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
    painInducingTechniquesUsed: {
      check: value => cy.get('#pain-inducing-techniques [type="checkbox"]').check(value),
      thumbLock: () => cy.get('#pain-inducing-techniques [type="checkbox"][value="THUMB_LOCK"]'),
      shoulderControl: () => cy.get('#pain-inducing-techniques [type="checkbox"][value="SHOULDER_CONTROL"]'),
      upperArmControl: () => cy.get('#pain-inducing-techniques [type="checkbox"][value="UPPER_ARM_CONTROL"]'),
      mandibularAngleTechnique: () =>
        cy.get('#pain-inducing-techniques [type="checkbox"][value="MANDIBULAR_ANGLE_TECHNIQUE"]'),
      finalLockFlexion: () => cy.get('#pain-inducing-techniques [type="checkbox"][value="FINAL_LOCK_FLEXION"]'),
      finalLockRotation: () => cy.get('#pain-inducing-techniques [type="checkbox"][value="FINAL_LOCK_ROTATION"]'),
      throughRigidBarCuffs: () =>
        cy.get('#pain-inducing-techniques [type="checkbox"][value="THROUGH_RIGID_BAR_CUFFS"]'),
    },

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
      this.painInducingTechniquesUsed.check(['THUMB_LOCK', 'FINAL_LOCK_FLEXION'])
    },

    errorSummary() {
      return cy.get('.govuk-error-summary')
    },

    clickSaveAndContinue: () => cy.get('[data-qa="save-and-continue"]').click(),
    clickSave: () => cy.get('[data-qa="save"]').click(),
    clickCancel: () => cy.get('[data-qa="cancel"]').click(),

    save() {
      this.clickSaveAndContinue()
      return RelocationAndInjuriesPage.verifyOnPage()
    },

    saveAndReturnToUseOfForce() {
      return cy.get('[data-qa="save-and-return"]').click()
    },
  })

module.exports = { verifyOnPage: useOfForceDetailsPage }
