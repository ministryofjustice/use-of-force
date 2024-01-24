const joi = require('@hapi/joi')
const { required } = require('@hapi/joi')
const { validations } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')
const { ControlAndRestraintPosition } = require('../types')

const { requiredBooleanMsg, requiredOneOfMsg, requiredIntegerRangeMsg, optionalForPartialValidation } = validations

const completeSchema = joi.object({
  positiveCommunication: requiredBooleanMsg('Select yes if positive communication was used').alter(
    optionalForPartialValidation
  ),

  personalProtectionTechniques: requiredBooleanMsg('Select yes if any personal protection techniques were used').alter(
    optionalForPartialValidation
  ),

  batonDrawn: requiredBooleanMsg('Select yes if a baton was drawn').alter(optionalForPartialValidation),

  batonUsed: joi.when('batonDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if a baton was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  pavaDrawn: requiredBooleanMsg('Select yes if PAVA was drawn').alter(optionalForPartialValidation),

  pavaUsed: joi.when('pavaDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if PAVA was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  guidingHold: requiredBooleanMsg('Select yes if a guiding hold was used').alter(optionalForPartialValidation),

  guidingHoldOfficersInvolved: joi.when('guidingHold', {
    is: true,
    then: requiredIntegerRangeMsg(
      1,
      2
    )('Select how many officers were involved in the guiding hold').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  escortingHold: requiredBooleanMsg('Select yes if an escorting hold was used').alter(optionalForPartialValidation),
  restraintPositions: joi.any().required().alter(optionalForPartialValidation),
  // restraintPositions: joi
  //   .alternatives()
  //   .try(
  //     joi
  //       .array()
  //       .items(
  //         requiredOneOfMsg(
  //           'STANDING',
  //           'FACE_DOWN',
  //           'ON_BACK',
  //           'KNEELING',
  //           'NONE'
  //         )('Select if any control and restraint positions were used').alter(optionalForPartialValidation)
  //       ),
  //     joi.allow(
  //       positions.STANDING__WRIST_WEAVE.value,
  //       positions.STANDING__DOUBLE_WRIST_HOLD.value,
  //       positions.STANDING__UNDERHOOK.value,
  //       positions.STANDING__WRIST_HOLD.value,
  //       positions.STANDING__STRAIGHT_ARM_HOLD.value,
  //       positions.ON_BACK__STRAIGHT_ARM_HOLD.value,
  //       positions.ON_BACK__CONVERSION_TO_RBH.value,
  //       positions.ON_BACK__WRIST_HOLD.value,
  //       positions.FACE_DOWN__BALANCE_DISPLACEMENT.value,
  //       positions.FACE_DOWN__STRAIGHT_ARM_HOLD.value,
  //       positions.FACE_DOWN__CONVERSION_TO_RBH.value,
  //       positions.FACE_DOWN__WRIST_HOLD.value,
  //     )
  //   )
  //   .required()
  //   .messages({ 'any.required': 'Select the control and restraint positions used2' })
  //   .alter(optionalForPartialValidation),

  painInducingTechniques: requiredBooleanMsg('Select yes if pain inducing techniques were used').alter(
    optionalForPartialValidation
  ),

  painInducingTechniquesUsed: joi.when('painInducingTechniques', {
    is: true,
    then: joi
      .alternatives()
      .try(
        joi
          .array()
          .items(
            requiredOneOfMsg(
              'FINAL_LOCK_FLEXION',
              'FINAL_LOCK_ROTATION',
              'MANDIBULAR_ANGLE_TECHNIQUE',
              'SHOULDER_CONTROL',
              'THROUGH_RIGID_BAR_CUFFS',
              'THUMB_LOCK',
              'UPPER_ARM_CONTROL'
            )('Select the pain inducing techniques used').alter(optionalForPartialValidation)
          )
      )
      .required()
      .messages({ 'any.required': 'Select the pain inducing techniques used' })
      .alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  handcuffsApplied: requiredBooleanMsg('Select yes if handcuffs were applied').alter(optionalForPartialValidation),
})

module.exports = {
  complete: buildValidationSpec(completeSchema),
  partial: buildValidationSpec(completeSchema.tailor('partial')),
}
