const { joi, validations } = require('./validations')

module.exports = joi.object({
  prisonerRelocation: validations.requiredString,
  relocationCompliancy: validations.requiredBoolean,
  f213CompletedBy: validations.f213CompletedBy,
  prisonerInjuries: validations.requiredBoolean,
  healthcareInvolved: validations.requiredBoolean,
  healthcarePractionerName: validations.requiredMemberOfHealthcare,
  prisonerHospitalisation: validations.requiredBoolean,
  staffMedicalAttention: validations.requiredBoolean,
  staffNeedingMedicalAttention: validations.requiredStaffNeedingMedicalAttention,
})
