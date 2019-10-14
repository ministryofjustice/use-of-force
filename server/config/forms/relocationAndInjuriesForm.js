const { joi, validations, namePattern, setErrorMessage, caseInsensitiveComparator } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toBoolean, removeEmptyValues, trimmedString } = require('./sanitisers')

const { requiredString, requiredStringMsg, requiredBoolean, requiredBooleanMsg, arrayOfObjects } = validations

const f213CompletedBy = requiredStringMsg('Enter the name of who completed the F213 form')
  .regex(namePattern, 'F213')
  .message('Names may only contain letters, spaces, hyphens or apostrophes')

module.exports = {
  f213CompletedBy,
  formConfig: {
    fields: [
      {
        prisonerRelocation: {
          sanitiser: trimmedString,
        },
      },
      {
        relocationCompliancy: {
          sanitiser: toBoolean,
        },
      },
      {
        f213CompletedBy: {},
      },
      {
        prisonerInjuries: {
          sanitiser: toBoolean,
        },
      },
      {
        healthcareInvolved: {
          sanitiser: toBoolean,
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
        },
      },
      {
        staffMedicalAttention: {
          sanitiser: toBoolean,
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
        prisonerRelocation: requiredStringMsg('Select where the prisoner was relocated to'),

        relocationCompliancy: requiredBooleanMsg('Select yes if the prisoner was compliant'),

        f213CompletedBy,

        prisonerInjuries: requiredBooleanMsg('Select yes if the prisoner sustained any injuries'),

        healthcareInvolved: requiredBooleanMsg('Select yes if a member of healthcare was present during the incident'),

        healthcarePractionerName: joi.when('healthcareInvolved', {
          is: true,
          then: requiredString.regex(namePattern, 'HealthcarePractitioner'),
        }),

        prisonerHospitalisation: requiredBooleanMsg('Select yes if the prisoner needed outside hospitalisation'),

        staffMedicalAttention: requiredBooleanMsg('Select yes if a staff member needed medical attention'),

        staffNeedingMedicalAttention: joi.when('staffMedicalAttention', {
          is: true,
          then: arrayOfObjects({
            name: requiredString.regex(namePattern, 'StaffMedicalAttention'),
            hospitalisation: requiredBooleanMsg('Select yes if the staff member had to go to hospital'),
          })
            .min(1)
            .ruleset.unique(caseInsensitiveComparator('name'))
            .message("Name '{#value.name}' has already been added - remove this name")
            .required(),
        }),
      }),
    },
    isComplete(values) {
      return isValid(this.schemas.complete, values)
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/evidence`,
    },
  },
}
