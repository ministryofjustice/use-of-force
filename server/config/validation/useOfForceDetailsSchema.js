const { joi, validations } = require('./validations')

module.exports = joi.object({
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
})
