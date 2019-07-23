const moment = require('moment')

module.exports = {
  newIncident: {
    fields: [
      {
        incidentDate: {
          responseType: 'requiredString',
          sanitiser: val => moment(val, 'DD/MM/YYYY-HH:mm').toDate(),
        },
      },
      {
        locationId: {
          responseType: 'requiredNumber',
          validationMessage: 'Where did the incident occur?',
          sanitiser: val => parseInt(val, 10),
        },
      },
      {
        forceType: {
          responseType: 'requiredString',
          validationMessage: 'Was the use of force planned?',
        },
      },
      {
        involved: {
          sanitiser: vals => inputsExcludingEmptyStrings(vals),
        },
      },
      {
        witnesses: {
          sanitiser: vals => inputsExcludingEmptyStrings(vals),
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
          responseType: 'requiredString',
          validationMessage: 'Was Positive Communication used?',
        },
      },
      {
        personalProtectionTechniques: {
          responseType: 'requiredString',
          validationMessage: 'Were Personal Protection techniques used?',
        },
      },
      {
        batonDrawn: {
          responseType: 'requiredString',
          validationMessage: 'Was a baton drawn?',
        },
      },
      {
        batonUsed: {
          responseType: 'requiredString',
          validationMessage: 'Was a baton used?',
        },
      },
      {
        pavaUsed: {
          responseType: 'requiredString',
          validationMessage: 'Was a pava used?',
        },
      },
      {
        pavaDrawn: {
          responseType: 'requiredString',
          validationMessage: 'Was a pava drawn?',
        },
      },
      {
        guidingHold: {
          responseType: 'requiredString',
          validationMessage: 'Was a guiding hold used?',
        },
      },
      {
        guidingHoldOfficersInvolved: {
          responseType: 'requiredString',
          validationMessage: 'How many officers were involved?',
        },
      },
      {
        restraint: {
          responseType: 'requiredString',
          validationMessage: 'Was control and restraint used?',
        },
      },
      {
        restraintPositions: {
          responseType: 'requiredString',
          validationMessage: 'What positions were used?',
        },
      },
      {
        handcuffsApplied: {
          responseType: 'requiredString',
          validationMessage: 'Were handcuffs applied?',
        },
      },
      {
        handcuffsType: {
          responseType: 'requiredString',
          validationMessage: 'What type of handcuffs were used?',
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
          responseType: 'requiredString',
          validationMessage: 'What type of relocation was it?',
        },
      },
      {
        healthcareInvolved: {
          responseType: 'requiredString',
          validationMessage: 'Was a a healthcare practioner involved?',
        },
      },
      {
        healthcarePractionerName: {
          responseType: 'requiredString',
          validationMessage: 'Name of healthcare practioner',
        },
      },
      {
        prisonerInjuries: {
          responseType: 'requiredString',
          validationMessage: 'Did the prisoner sustain any injuries?',
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
          responseType: 'requiredString',
          validationMessage: 'Did the prisoner require outside hospitalisation?',
        },
      },
      {
        staffMedicalAttention: {
          responseType: 'requiredString',
          validationMessage: 'Did a member of staff need medical attention at the time?',
        },
      },
      {
        staffMemberNeedingMedicalAttention: {
          sanitiser: vals => inputsExcludingEmptyStrings(vals),
        },
      },
      {
        staffMemberWentToHospital: {
          responseType: 'requiredString',
          validationMessage: 'Did they go to hospital?',
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
          responseType: 'requiredString',
          validationMessage: 'Any evidence bagged and tagged?',
        },
      },
      {
        tagNumbers: {
          sanitiser: vals => inputsExcludingEmptyStrings(vals),
        },
      },
      {
        evidenceDescriptions: {
          sanitiser: vals => inputsExcludingEmptyStrings(vals),
        },
      },
      {
        photographsTaken: {
          responseType: 'requiredString',
          validationMessage: 'Were any photographs taken?',
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
          sanitiser: vals => inputsExcludingEmptyStrings(vals),
        },
      },
    ],
    validate: false,
    nextPath: {
      path: '/check-answers/',
    },
  },
}

function inputsExcludingEmptyStrings(inputs) {
  const sanitisedArray = []
  inputs.forEach(input => {
    if (input.name !== null && input.name !== '' && input.name.trim() !== '') {
      sanitisedArray.push(input)
    }
  })
  return sanitisedArray
}
