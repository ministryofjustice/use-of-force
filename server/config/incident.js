const incidentDetails = require('./forms/incidentDetailsForm')
const staffInvolved = require('./forms/staffInvolved')
const useOfForceDetailsForm = require('./forms/useOfForceDetailsForm')
const relocationAndInjuriesForm = require('./forms/relocationAndInjuriesForm')
const evidenceForm = require('./forms/evidenceForm')

module.exports = {
  nextPaths: {
    incidentDetails: bookingId => `/report/${bookingId}/staff-involved`,
    involvedStaff: bookingId => `/report/${bookingId}/use-of-force-details`,
    useOfForceDetails: bookingId => `/report/${bookingId}/relocation-and-injuries`,
    relocationAndInjuries: bookingId => `/report/${bookingId}/evidence`,
    evidence: bookingId => `/report/${bookingId}/report-use-of-force`,
  },
  full: {
    incidentDetails: incidentDetails.complete,
    useOfForceDetails: useOfForceDetailsForm.complete,
    relocationAndInjuries: relocationAndInjuriesForm.complete,
    evidence: evidenceForm.complete,
    involvedStaff: staffInvolved.complete,
  },
  partial: {
    incidentDetails: incidentDetails.partial,
    useOfForceDetails: useOfForceDetailsForm.partial,
    relocationAndInjuries: relocationAndInjuriesForm.partial,
    evidence: evidenceForm.partial,
  },
}
