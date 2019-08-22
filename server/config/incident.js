const moment = require('moment')
const { isBlank } = require('../utils/utils')
const { EXTRACTED } = require('./fieldType')

const removeEmptyValues = attrs => (inputs = []) => inputs.filter(hasAtLeastOneOf(attrs))

const hasAtLeastOneOf = attrs => input => attrs.find(attr => !isBlank(input[attr]))

const toBoolean = val => (val == null ? null : val === 'true')

const toInteger = val => (val == null ? null : parseInt(val, 10))

const toDate = val => {
  if (!val) {
    return null
  }
  const date = moment(val)
  return date.isValid() ? date.toDate() : null
}

module.exports = {
  newIncident: {
    fields: [
      {
        incidentDate: {
          responseType: 'requiredString',
          sanitiser: toDate,
          fieldType: EXTRACTED,
        },
      },
      {
        locationId: {
          responseType: 'requiredNumber',
          validationMessage: 'Where did the incident occur?',
          sanitiser: toInteger,
        },
      },
      {
        plannedUseOfForce: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was the use of force planned?',
          sanitiser: toBoolean,
        },
      },
      {
        involved: {
          sanitiser: removeEmptyValues(['username']),
          fieldType: EXTRACTED,
        },
      },
      {
        witnesses: {
          sanitiser: removeEmptyValues(['name']),
        },
      },
    ],
    validate: false,
    nextPath: {
      path: bookingId => `/form/incident/details/${bookingId}`,
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
      {
        handcuffsType: {
          responseType: 'requiredHandcuffsType',
          validationMessage: 'Select the type of handcuffs used',
          dependentOn: 'handcuffsApplied',
          predicate: 'true',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: bookingId => `/form/incident/relocationAndInjuries/${bookingId}`,
    },
  },

  relocationAndInjuries: {
    fields: [
      {
        prisonerRelocation: {
          responseType: 'requiredString',
          validationMessage: 'Where was the prisoner relocated to?',
        },
      },
      {
        relocationCompliancy: {
          responseType: 'requiredBoolean',
          validationMessage: 'What type of relocation was it?',
          sanitiser: toBoolean,
        },
      },
      {
        healthcareInvolved: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was a a healthcare practioner involved?',
          sanitiser: toBoolean,
        },
      },
      {
        healthcarePractionerName: {
          responseType: 'requiredString',
          validationMessage: 'Name of healthcare practioner',
          dependentOn: 'healthcareInvolved',
          predicate: 'true',
        },
      },
      {
        prisonerInjuries: {
          responseType: 'requiredBoolean',
          validationMessage: 'Did the prisoner sustain any injuries?',
          sanitiser: toBoolean,
        },
      },
      {
        f213CompletedBy: {
          responseType: 'requiredString',
          validationMessage: 'Who completed the f213 form?',
        },
      },
      {
        prisonerHospitalisation: {
          responseType: 'requiredBoolean',
          validationMessage: 'Did the prisoner need outside hospitalisation?',
          sanitiser: toBoolean,
        },
      },
      {
        staffMedicalAttention: {
          responseType: 'requiredBoolean',
          validationMessage: 'Did a member of staff need medical attention at the time?',
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
        },
      },
    ],
    validate: false,
    nextPath: {
      path: bookingId => `/form/incident/evidence/${bookingId}`,
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
          validationMessage: 'Please input the camera number',
          firstFieldName: 'bodyWornCameraNumbers[0][cameraNum]',
        },
      },
    ],
    validate: true,
    nextPath: {
      path: bookingId => `/check-answers/${bookingId}`,
    },
  },
}
