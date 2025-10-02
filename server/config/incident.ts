import incidentDetails from './forms/incidentDetailsForm'
import staffInvolved from './forms/staffInvolved'
import useOfForceDetailsForm from './forms/useOfForceDetailsForm'
import relocationAndInjuriesForm from './forms/relocationAndInjuriesForm'
import evidenceForm from './forms/evidenceForm'
import reasonsForUseOfForceForm from './forms/reasonsForUseOfForceForm'

export const paths = {
  reportUseOfForce: bookingId => `/report/${bookingId}/report-use-of-force`,
  incidentDetails: bookingId => `/report/${bookingId}/incident-details`,
  staffInvolved: bookingId => `/report/${bookingId}/staff-involved`,
  addInvolvedStaff: reportId => `/coordinator/report/${reportId}/add-staff`,
  addInvolvedStaffResult: (reportId, result) => `/coordinator/report/${reportId}/add-staff/result/${result}`,
  staffMemberName: bookingId => `/report/${bookingId}/staff-member-name`,
  staffNotFound: bookingId => `/report/${bookingId}/staff-member-not-found`,
  selectStaffMember: bookingId => `/report/${bookingId}/select-staff-member`,
  deleteStaffMember: (bookingId, username) => `/report/${bookingId}/delete-staff-member/${username}`,
  whyWasUofApplied: bookingId => `/report/${bookingId}/why-was-uof-applied`,
  whatWasPrimaryReasonForUoF: bookingId => `/report/${bookingId}/what-was-the-primary-reason-of-uof`,
  useOfForceDetails: bookingId => `/report/${bookingId}/use-of-force-details`,
  relocationAndInjuries: bookingId => `/report/${bookingId}/relocation-and-injuries`,
  evidence: bookingId => `/report/${bookingId}/evidence`,
  checkYourAnswers: bookingId => `/report/${bookingId}/check-your-answers`,
  requestRemoval: (statementId, signature) =>
    `/request-removal/${statementId}${signature ? `?signature=${signature}` : ''}`,
  alreadyRemoved: () => '/already-removed',
  removalAlreadyRequested: () => '/removal-already-requested',
  removalRequested: () => '/removal-requested',

  // coordinator
  viewRemovalRequest: (reportId, statementId) =>
    `/coordinator/report/${reportId}/statement/${statementId}/view-removal-request`,
  staffMemberNotRemoved: (reportId, statementId) =>
    `/coordinator/report/${reportId}/statement/${statementId}/staff-member-not-removed`,
  viewStatements: reportId => `/${reportId}/view-statements`,
  viewReport: reportId => `/${reportId}/view-report`,
  confirmStatementDelete: (reportId, statementId, removalRequest) =>
    `/coordinator/report/${reportId}/statement/${statementId}/confirm-delete${
      removalRequest ? `?removalRequest=${removalRequest}` : ''
    }`,
  confirmReportDelete: reportId => `/coordinator/report/${reportId}/confirm-delete`,
  viewEditAddInvolvedStaff: reportId => `/${reportId}/edit-report/add-staff-involved`,

  // admin
  editReport: reportId => `/${reportId}/edit-report`,
  editForm: (reportId, form) => `/${reportId}/edit-report/${form}`,
}

export const nextPaths = {
  incidentDetails: paths.staffInvolved,
  involvedStaff: paths.whyWasUofApplied,
  useOfForceDetails: paths.relocationAndInjuries,
  relocationAndInjuries: paths.evidence,
  evidence: paths.reportUseOfForce,
}

export const full = {
  incidentDetails: incidentDetails.complete,
  reasonsForUseOfForce: reasonsForUseOfForceForm.complete,
  useOfForceDetails: useOfForceDetailsForm.complete,
  relocationAndInjuries: relocationAndInjuriesForm.complete,
  evidence: evidenceForm.complete,
  involvedStaff: staffInvolved.complete,
}

export const partial = {
  incidentDetails: incidentDetails.partial,
  useOfForceDetails: useOfForceDetailsForm.partial,
  relocationAndInjuries: relocationAndInjuriesForm.partial,
  evidence: evidenceForm.partial,
}
