const joi = require('@hapi/joi')
const { validations } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')

const {
  requiredBooleanMsg,
  requiredOneOfMsg,
  requiredIntegerRangeMsg,
  optionalForPartialValidation,
  arrayOfObjects,
  requiredStringMsg,
  minZeroForPartialValidation,
} = validations

const completeSchema = joi.object({
  positiveCommunication: requiredBooleanMsg('Select yes if positive communication was used').alter(
    optionalForPartialValidation
  ),

  bodyWornCamera: requiredOneOfMsg(
    'YES',
    'NO',
    'NOT_KNOWN'
  )('Select yes if any part of the incident was captured on a body-worn camera').alter(optionalForPartialValidation),

  bodyWornCameraNumbers: joi
    .when('bodyWornCamera', {
      is: 'YES',
      then: arrayOfObjects({
        cameraNum: requiredStringMsg('Enter the body-worn camera number').alter(optionalForPartialValidation),
      })
        .min(1)
        .message('Enter the body-worn camera number')
        .ruleset.unique('cameraNum')
        .message("Camera '{#value.cameraNum}' has already been added - remove this camera")
        .required()
        .alter(minZeroForPartialValidation),
      otherwise: joi.any().strip(),
    })
    .meta({ firstFieldName: 'bodyWornCameraNumbers[0]' }),

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
  restraintPositions: joi
    .alternatives()
    .try(
      joi
        .valid('STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING', 'NONE')
        .messages({ 'any.only': 'Select which control and restraint positions were used' }),
      joi
        .array()
        .items(
          requiredOneOfMsg(
            'STANDING',
            'STANDING__WRIST_WEAVE',
            'STANDING__DOUBLE_WRIST_HOLD',
            'STANDING__UNDERHOOK',
            'STANDING__WRIST_HOLD',
            'STANDING__STRAIGHT_HOLD',
            'ON_BACK',
            'ON_BACK__STRAIGHT_ARM_HOLD',
            'ON_BACK__CONVERSION_TO_RBH',
            'ON_BACK__WRIST_HOLD',
            'FACE_DOWN',
            'FACE_DOWN__BALANCE_DISPLACEMENT',
            'FACE_DOWN__STRAIGHT_ARM_HOLD',
            'FACE_DOWN__CONVERSION_TO_RBH',
            'FACE_DOWN__WRIST_HOLD',
            'KNEELING'
          )('Select which control and restraint positions were used')
        )
    )
    .messages({
      'alternatives.types': 'Select which control and restraint positions were used',
    })
    .required()
    .messages({
      'any.required': 'Select which control and restraint positions were used',
    })
    .alter(optionalForPartialValidation),

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
