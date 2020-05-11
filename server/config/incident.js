const incidentDetails = require('./forms/incidentDetailsForm')
const useOfForceDetailsForm = require('./forms/useOfForceDetailsForm')
const relocationAndInjuriesForm = require('./forms/relocationAndInjuriesForm')
const evidenceForm = require('./forms/evidenceForm')
const changePrisonForm = require('./forms/changePrisonForm')

module.exports = {
  paths: {
    incidentDetails: { path: bookingId => `/report/${bookingId}/use-of-force-details` },
    useOfForceDetails: { path: bookingId => `/report/${bookingId}/relocation-and-injuries` },
    relocationAndInjuries: { path: bookingId => `/report/${bookingId}/evidence` },
    evidence: { path: bookingId => `/report/${bookingId}/check-your-answers` },
  },
  full: {
    incidentDetails: incidentDetails.complete,
    changePrison: changePrisonForm.complete,
    useOfForceDetails: useOfForceDetailsForm.complete,
    relocationAndInjuries: relocationAndInjuriesForm.complete,
    evidence: evidenceForm.complete,
  },
  persistent: {
    incidentDetails: incidentDetails.persistent,
    useOfForceDetails: useOfForceDetailsForm.complete,
    relocationAndInjuries: relocationAndInjuriesForm.complete,
    evidence: evidenceForm.complete,
  },
  partial: {
    incidentDetails: incidentDetails.partial,
    useOfForceDetails: useOfForceDetailsForm.partial,
    changePrison: changePrisonForm.partial,
    relocationAndInjuries: relocationAndInjuriesForm.partial,
    evidence: evidenceForm.partial,
  },
}
