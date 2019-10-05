const { joi, validations } = require('./validations')
const { validate } = require('../../utils/fieldValidation')
const { toInteger, toBoolean } = require('./sanitisers')

module.exports = {
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
      positiveCommunication: validations.requiredBoolean,
      personalProtectionTechniques: validations.requiredBoolean,
      batonDrawn: validations.requiredBoolean,
      batonUsed: validations.requiredBatonUsed,
      pavaDrawn: validations.requiredBoolean,
      pavaUsed: validations.requiredPavaUsed,
      guidingHold: validations.requiredBoolean,
      guidingHoldOfficersInvolved: validations.requiredOfficersInvolved,
      restraint: validations.requiredBoolean,
      restraintPositions: validations.requiredRestraintPositions,
      handcuffsApplied: validations.requiredBoolean,
    }),
  },
  isComplete(values) {
    return validate(this.fields, this.schemas.complete, values).length === 0
  },
  nextPath: {
    path: bookingId => `/report/${bookingId}/relocation-and-injuries`,
  },
}
