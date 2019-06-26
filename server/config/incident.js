module.exports = {
  newIncident: {
    fields: [],
    validate: false,
    nextPath: {
      path: '/form/incident/details/',
    },
  },

  details: {
    fields: [],
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
