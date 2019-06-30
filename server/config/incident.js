module.exports = {
  newIncident: {
    fields: [],
    validate: false,
    nextPath: {
      path: '/form/incident/details/',
    },
  },

  details: {
    fields: [
      {
        'positive-communication': {
          responseType: 'requiredString',
          validationMessage: 'Was Positive Communication used?',
        },
      },
      {
        'personal-protection-techniques': {
          responseType: 'requiredString',
          validationMessage: 'Were Personal Protection techniques used?',
        },
      },
      {
        'baton-drawn-conditional': {
          responseType: 'requiredString',
          validationMessage: 'Was a baton drawn?',
        },
      },
      {
        'pava-drawn-conditional': {
          responseType: 'requiredString',
          validationMessage: 'Was a pava drawn?',
        },
      },
      {
        'guiding-hold-conditional': {
          responseType: 'requiredString',
          validationMessage: 'Was a guiding hold used?',
        },
      },
      {
        'restraint-conditional': {
          responseType: 'requiredString',
          validationMessage: 'Was control and restraint used?',
        },
      },
      {
        'handcuffs-conditional': {
          responseType: 'requiredString',
          validationMessage: 'Were handcuffs applied?',
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
