import { QUESTION_SET } from './incidentDetailsConfig'
import { QUESTION_SET as RAIQS } from './relocationAndInjuriesConfig'
import { QUESTION_SET as EQS } from './evidenceConfig'

// this will hold the questions every page. Keys to match those in db
export default {
  incidentDetails: {
    agencyId: QUESTION_SET.PRISON,
    incidentLocation: QUESTION_SET.INCIDENT_LOCATION,
    witnesses: QUESTION_SET.WITNESSES,
    plannedUseOfForce: QUESTION_SET.PLANNED_UOF,
    authorisedBy: QUESTION_SET.AUTHORISED_BY,
    incidentDate: QUESTION_SET.INCIDENT_DATE,
  },
  relocationAndInjuries: {
    prisonerRelocation: RAIQS.PRISONER_RELOCATION,
    relocationCompliancy: RAIQS.RELOCATION_COMPLIANCY,
    relocationType: RAIQS.RELOCATION_TYPE,
    userSpecifiedRelocationType: RAIQS.USER_SPECIFIED_RELOCATION_TYPE,
    f213CompletedBy: RAIQS.F213_COMPLETED_BY,
    prisonerInjuries: RAIQS.PRISONER_INJURIES,
    healthcareInvolved: RAIQS.HEALTHCARE_INVOLVED,
    healthcarePractionerName: RAIQS.HEALTHCARE_PRACTIONER_NAME,
    prisonerHospitalisation: RAIQS.PRISONER_HOSPITALISATION,
    staffMedicalAttention: RAIQS.STAFF_MEDICAL_ATTENTION,
    staffNeedingMedicalAttention: RAIQS.STAFF_NEEDING_MEDICAL_ATTENTION,
  },
  evidence: {
    baggedEvidence: EQS.BAGGED_EVIDENCE,
    evidenceTagAndDescription: EQS.EVIDENCE_TAG_AND_DESCRIPTION,
    photographsTaken: EQS.PHOTOGRAPHS_TAKEN,
    cctvRecording: EQS.CCTV_RECORDING,
  },

  // Add mappings for the other sections/pages of the report here. Keys to be in the order to display in reasons page
}
