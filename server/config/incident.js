const moment = require('moment')
const { isBlank } = require('../utils/utils')
const { EXTRACTED } = require('./fieldType')

const removeEmptyValues = attrs => (inputs = []) => inputs.filter(hasAtLeastOneOf(attrs))

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
          responseType: 'requiredInvolvedStaff',
          validationMessage: 'Enter the name of the staff member involved in the use of force incident',
          sanitiser: removeEmptyValues(['username']),
          firstFieldName: 'involvedStaff[0][username]',
        },
      },
      {
        witnesses: {
          responseType: 'any',
          sanitiser: removeEmptyValues(['name']),
        },
      },
    ],
    validate: true,
    nextPath: {
      path: bookingId => `/report/${bookingId}/use-of-force-details`,
    },
  },

  details: {
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
    nextPath: {
      path: bookingId => `/report/${bookingId}/relocation-and-injuries`,
    },
  },

  relocationAndInjuries: {
    fields: [
      {
        prisonerRelocation: {
          responseType: 'requiredString',
          validationMessage: 'Select where the prisoner was relocated to',
        },
      },
      {
        relocationCompliancy: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if the prisoner was compliant',
          sanitiser: toBoolean,
        },
      },
      {
        f213CompletedBy: {
          responseType: 'requiredString',
          validationMessage: 'Enter the name of who completed the F213 form',
        },
      },
      {
        prisonerInjuries: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if the prisoner sustained any injuries',
          sanitiser: toBoolean,
        },
      },
      {
        healthcareInvolved: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if a member of healthcare was present during the incident',
          sanitiser: toBoolean,
        },
      },
      {
        healthcarePractionerName: {
          responseType: 'requiredMemberOfHealthcare',
          validationMessage: 'Enter the name of the member of healthcare',
          dependentOn: 'healthcareInvolved',
          predicate: 'true',
        },
      },
      {
        prisonerHospitalisation: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if the prisoner needed outside hospitalisation',
          sanitiser: toBoolean,
        },
      },
      {
        staffMedicalAttention: {
          responseType: 'requiredBoolean',
          validationMessage: 'Select yes if a staff member needed medical attention',
          sanitiser: toBoolean,
        },
      },
      {
        staffNeedingMedicalAttention: {
          responseType: 'requiredStaffNeedingMedicalAttention',
          validationMessage: "Enter the staff member's name and whether they went to hospital",

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
    nextPath: {
      path: bookingId => `/report/${bookingId}/check-your-answers`,
    },
  },
}
