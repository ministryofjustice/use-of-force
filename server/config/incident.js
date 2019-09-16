const moment = require('moment')
const { isBlank } = require('../utils/utils')
const { EXTRACTED } = require('./fieldType')
const { validate, isValid } = require('../utils/fieldValidation')

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

const toDate = val => {
  if (!val) {
    return null
  }
  const date = moment(val)
  return date.isValid() ? date.toDate() : null
}

module.exports = {
  incidentDetails: {
    fields: [
      {
        incidentDate: {
          responseType: 'any',
          sanitiser: toDate,
          fieldType: EXTRACTED,
        },
      },
      {
        locationId: {
          responseType: 'requiredNumber',
          validationMessage: 'Select the location of the incident',
          sanitiser: toInteger,
        },
      },
      {
        plannedUseOfForce: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if the use of force was planned',
          sanitiser: toBoolean,
        },
      },
      {
        involvedStaff: {
          responseType: 'optionalInvolvedStaff',
          validationMessage: { 'string.regex.name': 'Usernames can only contain letters and an underscore' },
          sanitiser: sanitiseUsernames,
          firstFieldName: 'involvedStaff[0][username]',
        },
      },
      {
        witnesses: {
          responseType: 'optionalWitnesses',
          validationMessage: {
            'string.regex.name': 'Witness names can only contain letters, spaces, hyphens, apostrophe',
          },
          sanitiser: removeEmptyValues(['name']),
        },
      },
    ],
    validate: true,
    isComplete(values) {
      return (
        // It's possible to store invalid usernames which haven't been validated against the auth server.
        // The separate check ensures that all involvedStaff have the correct extra fields that are stored against them once validated.
        validate(this.fields, values, true).length === 0 &&
        isValid('optionalInvolvedStaffWhenPersisted', values.involvedStaff)
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
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if positive communication was used',
          sanitiser: toBoolean,
        },
      },
      {
        personalProtectionTechniques: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if any personal protection techniques were used',
          sanitiser: toBoolean,
        },
      },
      {
        batonDrawn: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if a baton was drawn',
          sanitiser: toBoolean,
        },
      },
      {
        batonUsed: {
          responseType: 'requiredBatonUsed',
          validationMessage: 'Select yes if a baton was used',
          sanitiser: toBoolean,
          dependentOn: 'batonDrawn',
          predicate: 'true',
        },
      },
      {
        pavaDrawn: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if PAVA was drawn',
          sanitiser: toBoolean,
        },
      },
      {
        pavaUsed: {
          responseType: 'requiredPavaUsed',
          validationMessage: 'Select yes if PAVA was used',
          sanitiser: toBoolean,
          dependentOn: 'pavaDrawn',
          predicate: 'true',
        },
      },
      {
        guidingHold: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if a guiding hold was used',
          sanitiser: toBoolean,
        },
      },
      {
        guidingHoldOfficersInvolved: {
          responseType: 'requiredOfficersInvolved',
          validationMessage: 'Select how many officers were involved in the guiding hold',
          sanitiser: toInteger,
          dependentOn: 'guidingHold',
          predicate: 'true',
        },
      },
      {
        restraint: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if control and restraint was used',
          sanitiser: toBoolean,
        },
      },
      {
        restraintPositions: {
          responseType: 'requiredRestraintPositions',
          validationMessage: 'Select the control and restraint positions used',
          dependentOn: 'restraint',
          predicate: 'true',
        },
      },
      {
        handcuffsApplied: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if handcuffs were applied',
          sanitiser: toBoolean,
        },
      },
    ],
    validate: true,
    isComplete(values) {
      return validate(this.fields, values).length === 0
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/relocation-and-injuries`,
    },
  },

  relocationAndInjuries: {
    fields: [
      {
        prisonerRelocation: {
          responseType: 'requiredString',
          sanitiser: trimmedString,
          validationMessage: 'Select where the prisoner was relocated to',
        },
      },
      {
        relocationCompliancy: {
          responseType: 'requiredBoolean',
          sanitiser: toBoolean,
          validationMessage: 'Select yes if the prisoner was compliant',
        },
      },
      {
        f213CompletedBy: {
          responseType: 'f213CompletedBy',
          sanitiser: trimmedString,
          validationMessage: {
            'string.regex.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
            'string.base': 'Enter the name of who completed the F213 form',
          },
        },
      },
      {
        prisonerInjuries: {
          responseType: 'requiredBoolean',
          sanitiser: toBoolean,
          validationMessage: 'Select yes if the prisoner sustained any injuries',
        },
      },
      {
        healthcareInvolved: {
          responseType: 'requiredBoolean',
          sanitiser: toBoolean,
          validationMessage: 'Select yes if a member of healthcare was present during the incident',
        },
      },
      {
        healthcarePractionerName: {
          responseType: 'requiredMemberOfHealthcare',
          validationMessage: {
            'string.regex.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
            'string.base': 'Enter the name of the member of healthcare',
          },

          sanitiser: trimmedString,
          dependentOn: 'healthcareInvolved',
          predicate: 'true',
        },
      },
      {
        prisonerHospitalisation: {
          responseType: 'requiredBoolean',
          sanitiser: toBoolean,
          validationMessage: 'Select yes if the prisoner needed outside hospitalisation',
        },
      },
      {
        staffMedicalAttention: {
          responseType: 'requiredBoolean',
          sanitiser: toBoolean,
          validationMessage: 'Select yes if a staff member needed medical attention',
        },
      },
      {
        staffNeedingMedicalAttention: {
          responseType: 'requiredStaffNeedingMedicalAttention',
          validationMessage: {
            'string.regex.name': 'Names may only contain letters, spaces, hyphens or apostrophes',
            'array.min': "Enter the staff member's name and whether they went to hospital",
            'any.required': 'Enter the name of who needed medical attention',
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
    validate: true,
    isComplete(values) {
      return validate(this.fields, values).length === 0
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/evidence`,
    },
  },

  evidence: {
    fields: [
      {
        baggedEvidence: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if any evidence was bagged and tagged',
          sanitiser: toBoolean,
        },
      },
      {
        evidenceTagAndDescription: {
          responseType: 'requiredTagAndDescription',
          sanitiser: removeEmptyValues(['description', 'evidenceTagReference']),
          validationMessage: 'Please input both the evidence tag number and the description',
          dependentOn: 'baggedEvidence',
          firstFieldName: 'baggedEvidence',
          predicate: 'true',
        },
      },
      {
        photographsTaken: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if any photographs were taken',
          sanitiser: toBoolean,
        },
      },
      {
        cctvRecording: {
          responseType: 'requiredYesNoNotKnown',
          validationMessage: 'Select yes if any part of the incident captured on CCTV',
        },
      },
      {
        bodyWornCamera: {
          responseType: 'requiredYesNoNotKnown',
          validationMessage: 'Select yes if any part of the incident was captured on a body-worn camera',
        },
      },
      {
        bodyWornCameraNumbers: {
          responseType: 'requiredCameraNumber',
          sanitiser: removeEmptyValues(['cameraNum']),
          dependentOn: 'bodyWornCamera',
          predicate: 'YES',
          validationMessage: 'Enter the body-worn camera number',
          firstFieldName: 'bodyWornCameraNumbers[0][cameraNum]',
        },
      },
    ],
    validate: true,
    isComplete(values) {
      return validate(this.fields, values).length === 0
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/check-your-answers`,
    },
  },
}
