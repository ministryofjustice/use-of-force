const { joi, validations } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toInteger, toBoolean } = require('./sanitisers')

const { requiredBoolean, requiredOneOf } = validations

module.exports = {
  formConfig: {
    fields: [
      {
        positiveCommunication: {
          validationMessage: 'Select yes if positive communication was used',
          sanitiser: toBoolean,
        },
      },
      {
        personalProtectionTechniques: {
          validationMessage: 'Select yes if any personal protection techniques were used',
          sanitiser: toBoolean,
        },
      },
      {
        batonDrawn: {
          validationMessage: 'Select yes if a baton was drawn',
          sanitiser: toBoolean,
        },
      },
      {
        batonUsed: {
          validationMessage: 'Select yes if a baton was used',
          sanitiser: toBoolean,
          dependentOn: 'batonDrawn',
          predicate: 'true',
        },
      },
      {
        pavaDrawn: {
          validationMessage: 'Select yes if PAVA was drawn',
          sanitiser: toBoolean,
        },
      },
      {
        pavaUsed: {
          validationMessage: 'Select yes if PAVA was used',
          sanitiser: toBoolean,
          dependentOn: 'pavaDrawn',
          predicate: 'true',
        },
      },
      {
        guidingHold: {
          validationMessage: 'Select yes if a guiding hold was used',
          sanitiser: toBoolean,
        },
      },
      {
        guidingHoldOfficersInvolved: {
          validationMessage: 'Select how many officers were involved in the guiding hold',
          sanitiser: toInteger,
          dependentOn: 'guidingHold',
          predicate: 'true',
        },
      },
      {
        restraint: {
          validationMessage: 'Select yes if control and restraint was used',
          sanitiser: toBoolean,
        },
      },
      {
        restraintPositions: {
          validationMessage: 'Select the control and restraint positions used',
          dependentOn: 'restraint',
          predicate: 'true',
        },
      },
      {
        handcuffsApplied: {
          validationMessage: 'Select yes if handcuffs were applied',
          sanitiser: toBoolean,
        },
      },
    ],
    schemas: {
      complete: joi.object({
        positiveCommunication: requiredBoolean,
        personalProtectionTechniques: requiredBoolean,

        batonDrawn: requiredBoolean,
        batonUsed: joi.when('batonDrawn', { is: true, then: requiredBoolean }),

        pavaDrawn: requiredBoolean,
        pavaUsed: joi.when('pavaDrawn', { is: true, then: requiredBoolean }),

        guidingHold: validations.requiredBoolean,
        guidingHoldOfficersInvolved: joi.when('guidingHold', { is: true, then: requiredOneOf(1, 2) }),

        restraint: validations.requiredBoolean,
        restraintPositions: joi.when('restraint', {
          is: true,
          then: joi
            .alternatives()
            .try(joi.array().items(requiredOneOf('STANDING', 'FACE_DOWN', 'ON_BACK', 'KNEELING')))
            .required(),
        }),

        handcuffsApplied: validations.requiredBoolean,
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
