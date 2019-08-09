const moment = require('moment')
const { isBlank } = require('../utils/utils')
const { EXTRACTED } = require('./fieldType')

const removeEmptyValues = attrs => (inputs = []) => inputs.filter(hasAtLeastOneOf(attrs))

const hasAtLeastOneOf = attrs => input => attrs.find(attr => !isBlank(input[attr]))

const toBoolean = val => (val == null ? null : val === 'true')

const toInteger = val => parseInt(val, 10)

module.exports = {
  newIncident: {
    fields: [
      {
        incidentDate: {
          responseType: 'requiredString',
          sanitiser: val => moment(val, 'DD/MM/YYYY-HH:mm').toDate(),
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
          sanitiser: removeEmptyValues(['name']),
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
          validationMessage: 'Was Positive Communication used?',
          sanitiser: toBoolean,
        },
      },
      {
        personalProtectionTechniques: {
          responseType: 'requiredBoolean',
          validationMessage: 'Were Personal Protection techniques used?',
          sanitiser: toBoolean,
        },
      },
      {
        batonDrawn: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was a baton drawn?',
          sanitiser: toBoolean,
        },
      },
      {
        batonUsed: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was a baton used?',
          sanitiser: toBoolean,
          dependentOn: 'batonDrawn',
          predicate: 'true',
        },
      },
      {
        pavaDrawn: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was a pava drawn?',
          sanitiser: toBoolean,
        },
      },
      {
        pavaUsed: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was a pava used?',
          sanitiser: toBoolean,
          dependentOn: 'pavaDrawn',
          predicate: 'true',
        },
      },
      {
        guidingHold: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was a guiding hold used?',
          sanitiser: toBoolean,
        },
      },
      {
        guidingHoldOfficersInvolved: {
          responseType: 'requiredNumber',
          validationMessage: 'How many officers were involved?',
          sanitiser: toInteger,
          dependentOn: 'guidingHold',
          predicate: 'true',
        },
      },
      {
        restraint: {
          responseType: 'requiredBoolean',
          validationMessage: 'Was control and restraint used?',
          sanitiser: toBoolean,
        },
      },
      {
        restraintPositions: {
          responseType: 'requiredString',
          validationMessage: 'What positions were used?',
          dependentOn: 'restraint',
          predicate: 'true',
        },
      },
      {
        handcuffsApplied: {
          responseType: 'requiredBoolean',
          validationMessage: 'Were handcuffs applied?',
          sanitiser: toBoolean,
        },
      },
      {
        handcuffsType: {
          responseType: 'requiredString',
          validationMessage: 'What type of handcuffs were used?',
          dependentOn: 'handcuffsApplied',
          predicate: 'true',
        },
      },
    ],
    validate: false,
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
          firstFieldName: 'evidenceTagAndDescription[0][evidenceTagReference]',
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
          responseType: 'requiredString',
          validationMessage: 'Select yes if any part of the incident captured on CCTV',
        },
      },
      {
        bodyWornCamera: {
          responseType: 'requiredString',
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
