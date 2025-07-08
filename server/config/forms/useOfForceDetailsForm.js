const joi = require('@hapi/joi')
const { validations } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')
const config = require('../../config')

const {
  requiredBooleanMsg,
  requiredOneOfMsg,
  requiredIntegerRangeMsg,
  optionalForPartialValidation,
  arrayOfObjects,
  requiredStringMsg,
  minZeroForPartialValidation,
} = validations

const schemaObjectIncludingDogAndTaserValidation = {
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

  batonDrawnAgainstPrisoner: requiredBooleanMsg('Select yes if a baton was drawn').alter(optionalForPartialValidation),

  batonUsed: joi.when('batonDrawnAgainstPrisoner', {
    is: true,
    then: requiredBooleanMsg('Select yes if a baton was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  pavaDrawnAgainstPrisoner: requiredBooleanMsg('Select yes if PAVA was drawn').alter(optionalForPartialValidation),

  pavaUsed: joi.when('pavaDrawnAgainstPrisoner', {
    is: true,
    then: requiredBooleanMsg('Select yes if PAVA was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  taserDrawn: requiredBooleanMsg('Select yes if a Taser was drawn against the prisoner').alter(
    optionalForPartialValidation
  ),

  taserOperativePresent: joi.when('taserDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if the prisoner was warned a Taser operative was present').alter(
      optionalForPartialValidation
    ),
    otherwise: joi.any().strip(),
  }),

  redDotWarning: joi.when('taserDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if a red-dot warning was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  arcWarningUsed: joi.when('taserDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if an arc warning was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  taserDeployed: joi.when('taserDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if the Taser was deployed').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),
  taserCycleExtended: joi.when('taserDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if the Taser cycle was extended').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  taserReenergised: joi.when('taserDrawn', {
    is: true,
    then: requiredBooleanMsg('Select yes if the Taser was re-energised').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  bittenByPrisonDog: requiredBooleanMsg('Select yes if the prisoner was bitten by a prison dog').alter(
    optionalForPartialValidation
  ),

  weaponsObserved: requiredOneOfMsg(
    'YES',
    'NO'
  )('Select yes if any weapons were observed').alter(optionalForPartialValidation),

  weaponTypes: joi
    .when('weaponsObserved', {
      is: 'YES',
      then: arrayOfObjects({
        weaponType: requiredStringMsg('Enter the type of weapon observed').alter(optionalForPartialValidation),
      })
        .min(1)
        .message('Enter the type of weapon observed')
        .required()
        .alter(minZeroForPartialValidation),
      otherwise: joi.any().strip(),
    })
    .meta({ firstFieldName: 'weaponTypes[0]' }),

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
            'STANDING__STRAIGHT_ARM_HOLD',
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

  painInducingTechniquesUsed: joi
    .alternatives()
    .try(
      joi
        .valid(
          'FINAL_LOCK_FLEXION',
          'FINAL_LOCK_ROTATION',
          'MANDIBULAR_ANGLE_TECHNIQUE',
          'SHOULDER_CONTROL',
          'THROUGH_RIGID_BAR_CUFFS',
          'THUMB_LOCK',
          'UPPER_ARM_CONTROL',
          'NONE'
        )
        .messages({ 'any.only': 'Select if any pain inducing techniques were used' }),
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
            'UPPER_ARM_CONTROL',
            'NONE'
          )('Select if any pain inducing techniques were used').alter(optionalForPartialValidation)
        )
    )
    .required()
    .messages({ 'any.required': 'Select if any pain inducing techniques were used' })
    .alter(optionalForPartialValidation),

  handcuffsApplied: requiredBooleanMsg('Select yes if handcuffs were applied').alter(optionalForPartialValidation),
}

const schemaObjectWithoutDogAndTaserValidation = {
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

  batonDrawnAgainstPrisoner: requiredBooleanMsg('Select yes if a baton was drawn').alter(optionalForPartialValidation),

  batonUsed: joi.when('batonDrawnAgainstPrisoner', {
    is: true,
    then: requiredBooleanMsg('Select yes if a baton was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  pavaDrawnAgainstPrisoner: requiredBooleanMsg('Select yes if PAVA was drawn').alter(optionalForPartialValidation),

  pavaUsed: joi.when('pavaDrawnAgainstPrisoner', {
    is: true,
    then: requiredBooleanMsg('Select yes if PAVA was used').alter(optionalForPartialValidation),
    otherwise: joi.any().strip(),
  }),

  weaponsObserved: requiredOneOfMsg(
    'YES',
    'NO'
  )('Select yes if any weapons were observed').alter(optionalForPartialValidation),

  weaponTypes: joi
    .when('weaponsObserved', {
      is: 'YES',
      then: arrayOfObjects({
        weaponType: requiredStringMsg('Enter the type of weapon observed').alter(optionalForPartialValidation),
      })
        .min(1)
        .message('Enter the type of weapon observed')
        .required()
        .alter(minZeroForPartialValidation),
      otherwise: joi.any().strip(),
    })
    .meta({ firstFieldName: 'weaponTypes[0]' }),

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
            'STANDING__STRAIGHT_ARM_HOLD',
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

  painInducingTechniquesUsed: joi
    .alternatives()
    .try(
      joi
        .valid(
          'FINAL_LOCK_FLEXION',
          'FINAL_LOCK_ROTATION',
          'MANDIBULAR_ANGLE_TECHNIQUE',
          'SHOULDER_CONTROL',
          'THROUGH_RIGID_BAR_CUFFS',
          'THUMB_LOCK',
          'UPPER_ARM_CONTROL',
          'NONE'
        )
        .messages({ 'any.only': 'Select if any pain inducing techniques were used' }),
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
            'UPPER_ARM_CONTROL',
            'NONE'
          )('Select if any pain inducing techniques were used').alter(optionalForPartialValidation)
        )
    )
    .required()
    .messages({ 'any.required': 'Select if any pain inducing techniques were used' })
    .alter(optionalForPartialValidation),

  handcuffsApplied: requiredBooleanMsg('Select yes if handcuffs were applied').alter(optionalForPartialValidation),
}

// when the featureFlagDisplayDogAndTaserQuestions flag is no longer needed then just use schemaObjectIncludingDogAndTaserValidation schema only
const completeSchema = config.default.featureFlagDisplayDogAndTaserQuestions
  ? joi.object(schemaObjectIncludingDogAndTaserValidation)
  : joi.object(schemaObjectWithoutDogAndTaserValidation)

module.exports = {
  complete: buildValidationSpec(completeSchema),
  partial: buildValidationSpec(completeSchema.tailor('partial')),
}
