const joi = require('@hapi/joi')
const { validations } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')

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

  restraint: requiredBooleanMsg('Select yes if control and restraint was used').alter(optionalForPartialValidation),

  restraintPositions: joi.when('restraint', {
    is: true,
    then: joi
      .alternatives()
      .try(
        joi
          .array()
          .items(
            requiredOneOfMsg(
              'STANDING',
              'FACE_DOWN',
              'ON_BACK',
              'KNEELING'
            )('Select the control and restraint positions used').alter(optionalForPartialValidation)
          )
      )
      .required()
      .messages({ 'any.required': 'Select the control and restraint positions used' })
      .alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

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
