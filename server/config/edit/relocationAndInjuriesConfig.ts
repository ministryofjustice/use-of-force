import { RelocationType, RelocationLocation } from '../types'

export default {
  SECTION: 'relocationAndInjuries',
}

export const QUESTION_SET = {
  PRISONER_RELOCATION: 'Where was the prisoner relocated to',
  RELOCATION_COMPLIANCY: 'Was the prisoner compliant',
  RELOCATION_TYPE: 'What was the type of relocation',
  USER_SPECIFIED_RELOCATION_TYPE: 'Type of other relocation',
  F213_COMPLETED_BY: 'Who completed the F213 form',
  PRISONER_INJURIES: 'Did the prisoner sustain any injuries at the time',
  HEALTHCARE_INVOLVED:
    'Was a member of healthcare present throughout the incident (doctor, registered nurse or healthcare officer)',
  HEALTHCARE_PRACTIONER_NAME: 'Name of healthcare member present ',
  PRISONER_HOSPITALISATION: 'Did the prisoner need outside hospitalisation at the time',
  STAFF_MEDICAL_ATTENTION: 'Did a member of staff need medical attention at the time',
  STAFF_NEEDING_MEDICAL_ATTENTION: 'Name of who needed medical attention',
}

export const QUESTION_ID = {
  PRISONER_RELOCATION: 'prisonerRelocation',
  RELOCATION_COMPLIANCY: 'relocationCompliancy',
  RELOCATION_TYPE: 'relocationType',
  USER_SPECIFIED_RELOCATION_TYPE: 'userSpecifiedRelocationType',
  F213_COMPLETED_BY: 'f213CompletedBy',
  PRISONER_INJURIES: 'prisonerInjuries',
  HEALTHCARE_INVOLVED: 'healthcareInvolved',
  HEALTHCARE_PRACTIONER_NAME: 'healthcarePractionerName',
  PRISONER_HOSPITALISATION: 'prisonerHospitalisation',
  STAFF_MEDICAL_ATTENTION: 'staffMedicalAttention',
  STAFF_NEEDING_MEDICAL_ATTENTION: 'staffNeedingMedicalAttention',
}

export const RELOCATION_TYPE_DESCRIPTION = {
  PRIMARY: RelocationType.PRIMARY.label,
  FULL: RelocationType.FULL.label,
  VEHICLE: RelocationType.VEHICLE.label,
  NTRG: RelocationType.NTRG.label,
  SEARCH_UNDER_RESTRAINT: RelocationType.SEARCH_UNDER_RESTRAINT.label,
  KNEELING: RelocationType.KNEELING.label,
  OTHER: RelocationType.OTHER.label,
}

export const RELOCATION_LOCATION_DESCRIPTION = {
  OWN_CELL: RelocationLocation.OWN_CELL.label,
  GATED_CELL: RelocationLocation.GATED_CELL.label,
  SEGREGATION_UNIT: RelocationLocation.SEGREGATION_UNIT.label,
  SPECIAL_ACCOMMODATION: RelocationLocation.SPECIAL_ACCOMMODATION.label,
  CELLULAR_VEHICLE: RelocationLocation.CELLULAR_VEHICLE.label,
  RECEPTION: RelocationLocation.RECEPTION.label,
  OTHER_WING: RelocationLocation.OTHER_WING.label,
  FACILITATE_RELEASE: RelocationLocation.CELLULAR_VEHICLE.label,
}
