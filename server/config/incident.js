const moment = require('moment')
const { isBlank } = require('../utils/utils')
const { EXTRACTED } = require('./fieldType')

const removeEmptyValues = attr => (inputs = []) => inputs.filter(input => !isBlank(input[attr]))

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
          sanitiser: removeEmptyValues('name'),
          fieldType: EXTRACTED,
        },
      },
      {
        witnesses: {
          sanitiser: removeEmptyValues('name'),
        },
      },
    ],
    validate: false,
    nextPath: {
      path: '/form/incident/details/',
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
      path: '/form/incident/relocationAndInjuries/',
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
            return removeEmptyValues('name')(values).map(({ name, hospitalisation }) => ({
              name,
              hospitalisation: toBoolean(hospitalisation),
            }))
          },
        },
      },
    ],
    validate: false,
    nextPath: {
      path: '/form/incident/evidence/',
    },
  },

  evidence: {
    fields: [
      {
        baggedEvidence: {
          responseType: 'requiredBoolean',
          validationMessage: 'Any evidence bagged and tagged?',
          sanitiser: toBoolean,
        },
      },
      {
        evidenceTagAndDescription: {
          sanitiser: removeEmptyValues('description'),
        },
      },
      {
        photographsTaken: {
          responseType: 'requiredBoolean',
          validationMessage: 'Were any photographs taken?',
          sanitiser: toBoolean,
        },
      },
      {
        cctvRecording: {
          responseType: 'requiredString',
          validationMessage: 'Was any part of the incident captured on CCTV?',
        },
      },
      {
        bodyWornCamera: {
          responseType: 'requiredString',
          validationMessage: 'Was any part of the incident captured on a body worn camera?',
        },
      },
      {
        bodyWornCameraNumbers: {
          sanitiser: removeEmptyValues('cameraNum'),
          dependentOn: 'bodyWornCamera',
          predicate: 'YES',
        },
      },
    ],
    validate: false,
    nextPath: {
      path: '/check-answers/',
    },
  },
}
