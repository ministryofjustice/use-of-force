const incidentDetails = require('./forms/incidentDetailsForm')
const staffInvolved = require('./forms/staffInvolved')
const useOfForceDetailsForm = require('./forms/useOfForceDetailsForm')
const relocationAndInjuriesForm = require('./forms/relocationAndInjuriesForm')
const evidenceForm = require('./forms/evidenceForm')

const paths = {
  reportUseOfForce: bookingId => `/report/${bookingId}/report-use-of-force`,
  incidentDetails: bookingId => `/report/${bookingId}/incident-details`,
  staffInvolved: bookingId => `/report/${bookingId}/staff-involved`,
  staffMemberName: bookingId => `/report/${bookingId}/staff-member-name`,
  staffNotFound: bookingId => `/report/${bookingId}/staff-member-not-found`,
  selectStaffMember: bookingId => `/report/${bookingId}/select-staff-member`,
  deleteStaffMember: (bookingId, username) => `/report/${bookingId}/delete-staff-member/${username}`,
  useOfForceDetails: bookingId => `/report/${bookingId}/use-of-force-details`,
  relocationAndInjuries: bookingId => `/report/${bookingId}/relocation-and-injuries`,
  evidence: bookingId => `/report/${bookingId}/evidence`,
  checkYourAnswers: bookingId => `/report/${bookingId}/check-your-answers`,
}

module.exports = {
  paths,
  nextPaths: {
    incidentDetails: paths.staffInvolved,
    involvedStaff: paths.useOfForceDetails,
    useOfForceDetails: paths.relocationAndInjuries,
    relocationAndInjuries: paths.evidence,
    evidence: paths.reportUseOfForce,
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
