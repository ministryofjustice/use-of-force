const { joi, validations } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toBoolean, removeEmptyValues, trimmedString } = require('./sanitisers')

module.exports = {
  fields: [
    {
      prisonerRelocation: {
        sanitiser: trimmedString,
        validationMessage: 'Select where the prisoner was relocated to',
      },
    },
    {
      relocationCompliancy: {
        sanitiser: toBoolean,
        validationMessage: 'Select yes if the prisoner was compliant',
      },
    },
    {
      f213CompletedBy: {
        sanitiser: trimmedString,
        validationMessage: {
          'string.pattern.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
          'string.base': 'Enter the name of who completed the F213 form',
        },
      },
    },
    {
      prisonerInjuries: {
        sanitiser: toBoolean,
        validationMessage: 'Select yes if the prisoner sustained any injuries',
      },
    },
    {
      healthcareInvolved: {
        sanitiser: toBoolean,
        validationMessage: 'Select yes if a member of healthcare was present during the incident',
      },
    },
    {
      healthcarePractionerName: {
        validationMessage: {
          'string.pattern.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
          'string.base': 'Enter the name of the member of healthcare',
        },

        sanitiser: trimmedString,
        dependentOn: 'healthcareInvolved',
        predicate: 'true',
      },
    },
    {
      prisonerHospitalisation: {
        sanitiser: toBoolean,
        validationMessage: 'Select yes if the prisoner needed outside hospitalisation',
      },
    },
    {
      staffMedicalAttention: {
        sanitiser: toBoolean,
        validationMessage: 'Select yes if a staff member needed medical attention',
      },
    },
    {
      staffNeedingMedicalAttention: {
        validationMessage: {
          'string.pattern.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
          'array.min': "Enter the staff member's name and whether they went to hospital",
          'any.required': 'Enter the name of who needed medical attention',
          'string.empty': 'Enter the name of who needed medical attention',
        },

        sanitiser: values => {
          return removeEmptyValues(['name', 'hospitalisation'])(values).map(({ name, hospitalisation }) => ({
            name,
            hospitalisation: toBoolean(hospitalisation),
          }))
        },
        dependentOn: 'staffMedicalAttention',
        firstFieldName: 'staffMedicalAttention',
        predicate: 'true',
      },
    },
  ],
  schemas: {
    complete: joi.object({
      prisonerRelocation: validations.requiredString,
      relocationCompliancy: validations.requiredBoolean,
      f213CompletedBy: validations.f213CompletedBy,
      prisonerInjuries: validations.requiredBoolean,
      healthcareInvolved: validations.requiredBoolean,
      healthcarePractionerName: validations.requiredMemberOfHealthcare,
      prisonerHospitalisation: validations.requiredBoolean,
      staffMedicalAttention: validations.requiredBoolean,
      staffNeedingMedicalAttention: validations.requiredStaffNeedingMedicalAttention,
    }),
  },
  isComplete(values) {
    return isValid(this.schemas.complete, values)
  },
  nextPath: {
    path: bookingId => `/report/${bookingId}/evidence`,
  },
}
