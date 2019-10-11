const { joi, validations } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toInteger, toBoolean } = require('./sanitisers')

const { requiredBooleanMsg, requiredOneOfMsg } = validations

module.exports = {
  formConfig: {
    fields: [
      {
        positiveCommunication: {
          sanitiser: toBoolean,
        },
      },
      {
        personalProtectionTechniques: {
          sanitiser: toBoolean,
        },
      },
      {
        batonDrawn: {
          sanitiser: toBoolean,
        },
      },
      {
        batonUsed: {
          sanitiser: toBoolean,
          dependentOn: 'batonDrawn',
          predicate: 'true',
        },
      },
      {
        pavaDrawn: {
          sanitiser: toBoolean,
        },
      },
      {
        pavaUsed: {
          sanitiser: toBoolean,
          dependentOn: 'pavaDrawn',
          predicate: 'true',
        },
      },
      {
        guidingHold: {
          sanitiser: toBoolean,
        },
      },
      {
        guidingHoldOfficersInvolved: {
          sanitiser: toInteger,
          dependentOn: 'guidingHold',
          predicate: 'true',
        },
      },
      {
        restraint: {
          sanitiser: toBoolean,
        },
      },
      {
        restraintPositions: {
          dependentOn: 'restraint',
          predicate: 'true',
        },
      },
      {
        handcuffsApplied: {
          sanitiser: toBoolean,
        },
      },
    ],
    schemas: {
      complete: joi.object({
        positiveCommunication: requiredBooleanMsg('Select yes if positive communication was used'),
        personalProtectionTechniques: requiredBooleanMsg('Select yes if any personal protection techniques were used'),

        batonDrawn: requiredBooleanMsg('Select yes if a baton was drawn'),
        batonUsed: joi.when('batonDrawn', { is: true, then: requiredBooleanMsg('Select yes if a baton was used') }),

        pavaDrawn: requiredBooleanMsg('Select yes if PAVA was drawn'),
        pavaUsed: joi.when('pavaDrawn', { is: true, then: requiredBooleanMsg('Select yes if PAVA was used') }),

        guidingHold: requiredBooleanMsg('Select yes if a guiding hold was used'),
        guidingHoldOfficersInvolved: joi.when('guidingHold', {
          is: true,
          then: requiredOneOfMsg(1, 2)('Select how many officers were involved in the guiding hold'),
        }),

        restraint: requiredBooleanMsg('Select yes if control and restraint was used'),
        restraintPositions: joi.when('restraint', {
          is: true,
          then: joi
            .alternatives()
            .try(
              joi
                .array()
                .items(
                  requiredOneOfMsg('STANDING', 'FACE_DOWN', 'ON_BACK', 'KNEELING')(
                    'Select the control and restraint positions used'
                  )
                )
            )
            .required()
            .messages({ 'any.required': 'Select the control and restraint positions used' }),
        }),

        handcuffsApplied: requiredBooleanMsg('Select yes if handcuffs were applied'),
      }),
    },
    isComplete(values) {
      return isValid(this.schemas.complete, values)
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/relocation-and-injuries`,
    },
  },
}
