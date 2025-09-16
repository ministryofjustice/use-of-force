export default {
  SECTION: 'incidentDetails',
}

export const QUESTION_SET = {
  PRISON: 'Prison',
  INCIDENT_LOCATION: 'Where did the incident happen?',
  WITNESSES: 'Witnesses to the incident',
  PLANNED_UOF: 'Was use of force planned?',
  AUTHORISED_BY: 'Who authorised use of force?',
  INCIDENT_DATE: 'When did the incident happen?',
}

export const QUESTION_ID = {
  INCIDENT_LOCATION: 'incidentLocation',
  WITNESSES: 'witnesses',
  PLANNED_UOF: 'plannedUseOfForce',
  AUTHORISED_BY: 'authorisedBy',
  INCIDENT_DATE: 'incidentDate',
  AGENCY_ID: 'agencyId',
}

export const REASON = {
  ERROR_IN_REPORT: 'errorInReport',
  ERROR_IN_REPORT_DESCRIPTION: 'Error in report',
  SOMETHING_MISSING: 'somethingMissingFromReport',
  SOMETHING_MISSING_DESCRIPTION: 'Something missing',
  NEW_EVIDENCE: 'newEvidence',
  NEW_EVIDENCE_DESCRIPTION: 'New evidence',
  ANOTHER_REASON: 'anotherReasonForEdit',
  ANOTHER_REASON_DESCRIPTION: 'Another reason',
}

export type DateTime = {
  date: string
  hour: string
  minute: string
}
