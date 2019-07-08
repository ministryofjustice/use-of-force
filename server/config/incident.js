module.exports = {
  newIncident: {
    fields: [
      {
        locationId: {
          responseType: 'requiredNumber',
          validationMessage: 'Where did the incident occur?',
        },
      },
      {
        forceType: {
          responseType: 'requiredString',
          validationMessage: 'Was the use of force planned?',
        },
      },
      {
        involved: {},
      },
      {
        witnesses: {},
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
    fields: [],
    validate: false,
    nextPath: {
      path: '/form/incident/evidence/',
    },
  },

  evidence: {
    fields: [],
    validate: false,
    nextPath: {
      path: '/check-answers/',
    },
  },
}
