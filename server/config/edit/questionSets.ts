import { QUESTION_SET } from './incidentDetailsConfig'
import { QUESTION_SET as RAIQS } from './relocationAndInjuriesConfig'
import { QUESTION_SET as EQS } from './evidenceConfig'
import { QUESTION_SET as UOFDQS } from './useOfForceDetailsConfig'
import { QUESTION_SET as RUOFQS } from './reasonsForUoFConfig'

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

  reasonsForUseOfForce: { reasons: RUOFQS.REASONS, primaryReason: RUOFQS.PRIMARY_REASON },

  useOfForceDetails: {
    positiveCommunication: UOFDQS.POSITIVE_COMMUNICATION,
    bodyWornCamera: UOFDQS.BODY_WORN_CAMERA,
    bodyWornCameraNumbers: UOFDQS.BODY_WORN_CAMERA_NUMBERS,
    personalProtectionTechniques: UOFDQS.PERSONAL_PROTECTION_TECHNIQUES,
    batonDrawnAgainstPrisoner: UOFDQS.BATON_DRAWN_AGAINST_PRISONER,
    batonUsed: UOFDQS.BATON_USED,
    pavaDrawnAgainstPrisoner: UOFDQS.PAVA_DRAWN_AGAINST_PRISONER,
    pavaUsed: UOFDQS.PAVA_USED,
    taserDrawn: UOFDQS.TASER_DRAWN,
    taserOperativePresent: UOFDQS.TASER_OPERATIVE_PRESENT,
    redDotWarning: UOFDQS.RED_DOT_WARNING,
    arcWarningUsed: UOFDQS.ARC_WARNING_USED,
    taserDeployed: UOFDQS.TASER_DEPLOYED,
    taserCycleExtended: UOFDQS.TASER_CYCLE_EXTENDED,
    taserReenergised: UOFDQS.TASER_REENERGISED,
    bittenByPrisonDog: UOFDQS.BITTEN_BY_PRISON_DOG,
    weaponsObserved: UOFDQS.WEAPONS_OBSERVED,
    weaponTypes: UOFDQS.WEAPON_TYPES,
    guidingHold: UOFDQS.GUIDING_HOLD,
    guidingHoldOfficersInvolved: UOFDQS.GUIDING_HOLD_OFFICERS_INVOLVED,
    escortingHold: UOFDQS.ESCORTING_HOLD,
    restraintPositions: UOFDQS.RESTRAINT_POSITIONS,
    painInducingTechniquesUsed: UOFDQS.PAIN_INDUCING_TECHNIQUES_USED,
    handcuffsApplied: UOFDQS.HANDCUFFS_APPLIED,
  },

  // Add mappings for the other sections/pages of the report here. Keys to be in the order to display in reasons page
}
