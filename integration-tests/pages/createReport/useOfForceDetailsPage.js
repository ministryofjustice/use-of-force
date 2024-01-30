import page from '../page'
import RelocationAndInjuriesPage from './relocationAndInjuriesPage'

const useOfForceDetailsPage = () =>
  page('Use of force details', {
    positiveCommunication: () => cy.get('[name="positiveCommunication"]'),

    bodyWornCamera: () => cy.get('[name="bodyWornCamera"]'),
    bodyWornCameraNumber: index => cy.get(`[name="bodyWornCameraNumbers[${index}][cameraNum]"]`),
    addAnotherBodyWornCamera: () => cy.get('[dataqa=add-another-body-worn-camera]').click(),
    removeBodyWornCamera: index =>
      cy.get('.add-another-body-worn-camera .add-another__remove-button').eq(index).click(),

    personalProtectionTechniques: () => cy.get('[name="personalProtectionTechniques"]'),
    batonDrawn: () => cy.get('[name="batonDrawn"]'),
    batonUsed: () => cy.get('[name="batonUsed"]'),
    pavaDrawn: () => cy.get('[name="pavaDrawn"]'),
    weaponsObserved: () => cy.get('[name="weaponsObserved"]'),
    weaponTypes: index => cy.get(`[name="weaponTypes[${index}][weaponType]"]`),
    addAnotherWeapon: () => cy.get('[dataqa=add-another-weapons-observed]').click(),
    pavaUsed: () => cy.get('[name="pavaUsed"]'),
    guidingHold: () => cy.get('[name="guidingHold"]'),
    guidingHoldOfficersInvolved: {
      check: value => cy.get('[name="guidingHoldOfficersInvolved"]').check(value),
      one: () => cy.get('[name="guidingHoldOfficersInvolved"][value="1"]'),
      two: () => cy.get('[name="guidingHoldOfficersInvolved"][value="2"]'),
    },

    escortingHold: () => cy.get('[name="escortingHold"]'),

    restraintPositions: {
      check: value => cy.get('#control-and-restraint [type="checkbox"]').check(value),
      standing: () => cy.get('#control-and-restraint [type="checkbox"][value="STANDING"]'),
      onBack: () => cy.get('#control-and-restraint [type="checkbox"][value="ON_BACK"]'),
      faceDown: () => cy.get('#control-and-restraint [type="checkbox"][value="FACE_DOWN"]'),
      kneeling: () => cy.get('#control-and-restraint [type="checkbox"][value="KNEELING"]'),
      none: () => cy.get('#control-and-restraint [type="checkbox"][value="NONE"]'),
    },

    handcuffsApplied: () => cy.get('[name="handcuffsApplied"]'),

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
      none: () => cy.get('#pain-inducing-techniques [type="checkbox"][value="NONE"]'),
    },

    fillForm() {
      this.positiveCommunication().check('true')
      this.bodyWornCamera().check('NO')
      this.personalProtectionTechniques().check('true')
      this.batonDrawn().check('true')
      this.batonUsed().check('true')
      this.pavaDrawn().check('true')
      this.pavaUsed().check('true')
      this.weaponsObserved().check('NO')
      this.guidingHold().check('true')
      this.guidingHoldOfficersInvolved.check('2')
      this.escortingHold().check('true')
      this.restraintPositions.check(['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'])
      this.handcuffsApplied().check('true')
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
