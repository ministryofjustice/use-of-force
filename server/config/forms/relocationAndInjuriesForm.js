const { joi, validations, namePattern, caseInsensitiveComparator } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toBoolean, removeEmptyValues, trimmedString } = require('./sanitisers')

const { requiredString, requiredStringMsg, requiredBooleanMsg, arrayOfObjects } = validations

const f213CompletedBy = requiredStringMsg('Enter the name of who completed the F213 form')
  .pattern(namePattern)
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
          then: requiredStringMsg('Enter the name of the member of healthcare')
            .pattern(namePattern)
            .message('Names may only contain letters, spaces, hyphens or apostrophes'),
        }),

        prisonerHospitalisation: requiredBooleanMsg('Select yes if the prisoner needed outside hospitalisation'),

        staffMedicalAttention: requiredBooleanMsg('Select yes if a staff member needed medical attention'),

        staffNeedingMedicalAttention: joi.when('staffMedicalAttention', {
          is: true,
          then: arrayOfObjects({
            name: requiredStringMsg('Enter the name of who needed medical attention')
              .pattern(namePattern)
              .message('Names may only contain letters, spaces, hyphens or apostrophes'),
            hospitalisation: requiredBooleanMsg('Select yes if the staff member had to go to hospital'),
          })
            .min(1)
            .message("Enter the staff member's name and whether they went to hospital")
            .unique(caseInsensitiveComparator('name'))
            .message("Name '{#value.name}' has already been added - remove this name")
            .required()
            .meta({ sanitiser: removeEmptyValues }),
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
