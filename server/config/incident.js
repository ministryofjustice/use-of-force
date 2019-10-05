const { isBlank } = require('../utils/utils')
const { EXTRACTED } = require('./fieldType')
const { validate, isValid } = require('../utils/fieldValidation')
const {
  validations: { optionalInvolvedStaffWhenPersisted },
} = require('./validation/validations')

const incidentDetailsSchema = require('./validation/incidentDetailsSchema')
const useOfForceDetailsSchema = require('./validation/useOfForceDetailsSchema')
const relocationAndInjuriesSchema = require('./validation/relocationAndInjuriesSchema')
const evidenceSchema = require('./validation/evidenceSchema')

const toDate = require('../utils/dateSanitiser')

const removeEmptyValues = attrs => (inputs = []) => inputs.filter(hasAtLeastOneOf(attrs)).map(withoutKeysNotIn(attrs))

const sanitiseUsernames = (inputs = []) =>
  inputs
    .filter(hasAtLeastOneOf(['username']))
    .map(withoutKeysNotIn(['username']))
    .map(({ username }) => ({ username: username.toUpperCase() }))

const withoutKeysNotIn = attrs => value =>
  attrs.reduce((previous, attr) => (value[attr] ? { ...previous, [attr]: value[attr].trim() } : previous), {})

const hasAtLeastOneOf = attrs => input => attrs.find(attr => !isBlank(input[attr]))

const toBoolean = val => {
  switch (val) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      return null
  }
}

const trimmedString = val => (val ? val.trim() : null)

const toInteger = val => {
  const number = parseInt(val, 10)
  return Number.isNaN(number) ? null : number
}

module.exports = {
  incidentDetails: {
    fields: [
      {
        incidentDate: {
          sanitiser: toDate,
          fieldType: EXTRACTED,
          validationMessage: {
            'incidentDate.date.day.number.base': 'Enter the date',
            'incidentDate.date.month.number.base': 'Enter the month',
            'incidentDate.date.year.number.base': 'Enter the year',
            'incidentDate.time.any.required': 'Enter the time of the incident',
            'incidentDate.time.string.empty': 'Enter the time of the incident',
            'incidentDate.time.string.pattern.base': 'Enter a time in the correct format - for example, 23:59',
            'incidentDate.isInvalidDate.any.invalid': 'Enter a date in the correct format - for example, 27 3 2007',
            'incidentDate.isFutureDateTime.any.invalid': 'Enter a time which is not in the future',
            'incidentDate.isFutureDate.any.invalid': 'Enter a date that is not in the future',
          },
        },
      },
      {
        locationId: {
          validationMessage: 'Select the location of the incident',
          sanitiser: toInteger,
        },
      },
      {
        plannedUseOfForce: {
          validationMessage: 'Select yes if the use of force was planned',
          sanitiser: toBoolean,
        },
      },
      {
        involvedStaff: {
          validationMessage: { 'string.pattern.name': 'Usernames can only contain letters and an underscore' },
          sanitiser: sanitiseUsernames,
          firstFieldName: 'involvedStaff[0][username]',
        },
      },
      {
        witnesses: {
          validationMessage: {
            'string.pattern.name': 'Witness names can only contain letters, spaces, hyphens, apostrophe',
          },
          sanitiser: removeEmptyValues(['name']),
        },
      },
    ],
    formSchema: incidentDetailsSchema,
    isComplete(values) {
      return (
        // It's possible to store invalid usernames which haven't been validated against the auth server.
        // The separate check ensures that all involvedStaff have the correct extra fields that are stored against them once validated.
        validate(this.fields, this.formSchema, values, true).length === 0 &&
        isValid(optionalInvolvedStaffWhenPersisted, values.involvedStaff)
      )
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/use-of-force-details`,
    },
  },

  useOfForceDetails: {
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
    formSchema: useOfForceDetailsSchema,
    isComplete(values) {
      return validate(this.fields, this.formSchema, values).length === 0
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/relocation-and-injuries`,
    },
  },

  relocationAndInjuries: {
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
    formSchema: relocationAndInjuriesSchema,
    isComplete(values) {
      return validate(this.fields, this.formSchema, values).length === 0
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/evidence`,
    },
  },

  evidence: {
    fields: [
      {
        baggedEvidence: {
          validationMessage: 'Select yes if any evidence was bagged and tagged',
          sanitiser: toBoolean,
        },
      },
      {
        evidenceTagAndDescription: {
          sanitiser: removeEmptyValues(['description', 'evidenceTagReference']),
          validationMessage: 'Please input both the evidence tag number and the description',
          dependentOn: 'baggedEvidence',
          firstFieldName: 'baggedEvidence',
          predicate: 'true',
        },
      },
      {
        photographsTaken: {
          validationMessage: 'Select yes if any photographs were taken',
          sanitiser: toBoolean,
        },
      },
      {
        cctvRecording: {
          validationMessage: 'Select yes if any part of the incident captured on CCTV',
        },
      },
      {
        bodyWornCamera: {
          validationMessage: 'Select yes if any part of the incident was captured on a body-worn camera',
        },
      },
      {
        bodyWornCameraNumbers: {
          sanitiser: removeEmptyValues(['cameraNum']),
          dependentOn: 'bodyWornCamera',
          predicate: 'YES',
          validationMessage: 'Enter the body-worn camera number',
          firstFieldName: 'bodyWornCameraNumbers[0][cameraNum]',
        },
      },
    ],
    formSchema: evidenceSchema,
    isComplete(values) {
      return validate(this.fields, this.formSchema, values).length === 0
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/check-your-answers`,
    },
  },
}
