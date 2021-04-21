export type LabelledValue = { readonly value: string; readonly label: string; readonly inactive?: boolean }
type LabelledEnum<K extends string> = Record<K, LabelledValue>

const toEnum = <K extends string>(value: LabelledEnum<K>): Readonly<LabelledEnum<K>> => Object.freeze(value)

export const toLabel = <K extends string>(type: LabelledEnum<K>, val: string): string => {
  const match = Object.keys(type).find(value => value === val)
  return match ? type[match].label : undefined
}

export const BodyWornCameras = toEnum({
  YES: { value: 'YES', label: 'Yes' },
  NO: { value: 'NO', label: 'No' },
  NOT_KNOWN: { value: 'NOT_KNOWN', label: 'Not Known' },
})

export const Cctv = toEnum({
  YES: { value: 'YES', label: 'Yes' },
  NO: { value: 'NO', label: 'No' },
  NOT_KNOWN: { value: 'NOT_KNOWN', label: 'Not Known' },
})

export const ControlAndRestraintPosition = toEnum({
  STANDING: { value: 'STANDING', label: 'Standing' },
  ON_BACK: { value: 'ON_BACK', label: 'On back (supine)' },
  FACE_DOWN: { value: 'FACE_DOWN', label: 'On front (prone)' },
  KNEELING: { value: 'KNEELING', label: 'Kneeling' },
})

export const PainInducingTechniquesUsed = toEnum({
  FINAL_LOCK_FLEXION: { value: 'FINAL_LOCK_FLEXION', label: 'Final lock flexion' },
  FINAL_LOCK_ROTATION: { value: 'FINAL_LOCK_ROTATION', label: 'Final lock rotation' },
  MANDIBULAR_ANGLE_TECHNIQUE: { value: 'MANDIBULAR_ANGLE_TECHNIQUE', label: 'Mandibular angle technique' },
  SHOULDER_CONTROL: { value: 'SHOULDER_CONTROL', label: 'Shoulder control' },
  THROUGH_RIGID_BAR_CUFFS: { value: 'THROUGH_RIGID_BAR_CUFFS', label: 'Through rigid bar cuffs' },
  THUMB_LOCK: { value: 'THUMB_LOCK', label: 'Thumb lock' },
  UPPER_ARM_CONTROL: { value: 'UPPER_ARM_CONTROL', label: 'Upper arm control' },
})

export const RelocationLocation = toEnum({
  OWN_CELL: { value: 'OWN_CELL', label: 'Own cell' },
  GATED_CELL: { value: 'GATED_CELL', label: 'Gated cell' },
  SEGREGATION_UNIT: { value: 'SEGREGATION_UNIT', label: 'Segregation unit' },
  SPECIAL_ACCOMMODATION: { value: 'SPECIAL_ACCOMMODATION', label: 'Special accommodation' },
  CELLULAR_VEHICLE: { value: 'CELLULAR_VEHICLE', label: 'Cellular vehicle' },
})

export const ReportStatus = toEnum({
  IN_PROGRESS: { value: 'IN_PROGRESS', label: 'In progress' },
  SUBMITTED: { value: 'SUBMITTED', label: 'Submitted' },
  COMPLETE: { value: 'COMPLETE', label: 'Complete' },
})

export const StatementStatus = toEnum({
  PENDING: { value: 'PENDING', label: 'Pending' },
  SUBMITTED: { value: 'SUBMITTED', label: 'Submitted' },
})

export const RelocationType = toEnum({
  SIDE: { value: 'SIDE', label: 'Side relocation', inactive: true },
  PRIMARY: { value: 'PRIMARY', label: 'Primary relocation' },
  FULL: { value: 'FULL', label: 'Full relocation' },
  VEHICLE: { value: 'VEHICLE', label: 'Relocated to vehicle' },
  NTRG: { value: 'NTRG', label: 'Handed to local staff (NTRG)' },
  OTHER: { value: 'OTHER', label: 'Other' },
})

export const UofReasons = toEnum({
  ASSAULT_ON_ANOTHER_PRISONER: { value: 'ASSAULT_ON_ANOTHER_PRISONER', label: 'Assault on another prisoner' },
  ASSAULT_ON_A_MEMBER_OF_STAFF: { value: 'ASSAULT_ON_A_MEMBER_OF_STAFF', label: 'Assault on a member of staff' },
  FIGHT_BETWEEN_PRISONERS: { value: 'FIGHT_BETWEEN_PRISONERS', label: 'Fight between prisoners' },
  TO_PREVENT_HARM_ASSAULT_OR_HARM_TO_OTHERS: {
    value: 'TO_PREVENT_HARM_ASSAULT_OR_HARM_TO_OTHERS',
    label: 'To prevent harm, assault or harm to others',
  },
  ASSAULT_BY_A_MEMBER_OF_PUBLIC: { value: 'ASSAULT_BY_A_MEMBER_OF_PUBLIC', label: 'Assault by a member of public' },
  PHYSICAL_THREAT: { value: 'PHYSICAL_THREAT', label: 'Physical threat' },
  VERBAL_THREAT: { value: 'VERBAL_THREAT', label: 'Verbal threat' },
  REFUSAL_TO_LOCATE_TO_CELL: { value: 'REFUSAL_TO_LOCATE_TO_CELL', label: 'Refusal to locate to cell' },
  TO_PREVENT_ESCAPE_OR_ABSCONDING: {
    value: 'TO_PREVENT_ESCAPE_OR_ABSCONDING',
    label: 'To prevent escape or absconding',
  },
  ATTEMPT_TO_GRAB_STAFF_PPE_OR_EQUIPMENT: {
    value: 'ATTEMPT_TO_GRAB_STAFF_PPE_OR_EQUIPMENT',
    label: 'Attempt to grab staff PPE or equipment',
  },
  RISK_REDUCTION_APPLICATION_OF_CUFFS_FOR_ESCORTING: {
    value: 'RISK_REDUCTION_APPLICATION_OF_CUFFS_FOR_ESCORTING',
    label: 'Risk reduction application of cuffs for escorting',
  },
  TO_PREVENT_DAMAGE_TO_PROPERTY: { value: 'TO_PREVENT_DAMAGE_TO_PROPERTY', label: 'To prevent damage to property' },
  SELF_HARM: { value: 'SELF_HARM', label: 'Self-harm' },
  UNDER_THE_INFLUENCE: { value: 'UNDER_THE_INFLUENCE', label: 'Under the influence' },
  TO_ADMINISTER_CARE_OR_DUE_TO_THE_MENTAL_CAPACITY_ACT_2005: {
    value: 'TO_ADMINISTER_CARE_OR_DUE_TO_THE_MENTAL_CAPACITY_ACT_2005',
    label: 'To administer care or due to the Mental Capacity Act 2005',
  },
  CONCERTED_INDISCIPLINE: { value: 'CONCERTED_INDISCIPLINE', label: 'Concerted indiscipline' },
  INCIDENT_AT_HEIGHT_NTRG: { value: 'INCIDENT_AT_HEIGHT_NTRG', label: 'Incident at height (NTRG)' },
  HOSTAGE_NTRG: { value: 'HOSTAGE_NTRG', label: 'Hostage (NTRG)' },
  OTHER_NTRG_INCIDENT: { value: 'OTHER_NTRG_INCIDENT', label: 'Other NTRG incident' },
})

export const Destinations = {
  CONTINUE: 'continue',
  TASKLIST: 'back-to-task-list',
  CHECK_YOUR_ANSWERS: 'check-your-answers',
}
