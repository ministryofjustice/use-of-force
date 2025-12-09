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
  FORGOTTEN_IN_REPORT: 'forgottenInReport',
  FORGOTTEN_IN_REPORT_DESCRIPTION: 'Forgotten in report',
  BODY_CAM_FOOTAGE_REAVELED_INVOLVED: 'bodycamFootageRevealedinvolved',
  BODY_CAM_FOOTAGE_REAVELED_INVOLVED_DESCRIPTION: 'Bodycam footage revealed they were involved',
  FOOTAGE_REAVELED_NOT_INVOLVED: 'footageRevealedNotInvolved',
  FOOTAGE_REAVELED_NOT_INVOLVED_DESCRIPTION: 'Bodycam or CCTV footage revealed the person was not involved',
  PERSON_ADDED_IN_ERROR: 'personAddedInError',
  PERSON_ADDED_IN_ERROR_DESCRIPTION: 'The person was confused for someone else and added in error',
}

export type DateTime = {
  date: string
  hour: string
  minute: string
}
