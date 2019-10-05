const { joi, validations } = require('./validations')

module.exports = joi.object({
  incidentDate: validations.requiredIncidentDate,
  locationId: validations.requiredNumber,
  plannedUseOfForce: validations.requiredBoolean,
  involvedStaff: validations.optionalInvolvedStaff,
  witnesses: validations.optionalWitnesses,
})
