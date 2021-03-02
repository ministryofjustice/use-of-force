const toLabel = (type, val) => {
  const match = Object.keys(type).find(value => value === val)
  return match ? type[match].label : undefined
}

const BodyWornCameras = {
  YES: { value: 'YES', label: 'Yes' },
  NO: { value: 'NO', label: 'No' },
  NOT_KNOWN: { value: 'NOT_KNOWN', label: 'Not Known' },
}

const Cctv = {
  YES: { value: 'YES', label: 'Yes' },
  NO: { value: 'NO', label: 'No' },
  NOT_KNOWN: { value: 'NOT_KNOWN', label: 'Not Known' },
}

const ControlAndRestraintPosition = {
  STANDING: { value: 'STANDING', label: 'Standing' },
  ON_BACK: { value: 'ON_BACK', label: 'On back' },
  FACE_DOWN: { value: 'FACE_DOWN', label: 'Face down' },
  KNEELING: { value: 'KNEELING', label: 'Kneeling' },
}

const PainInducingTechniques = {
  FINAL_LOCK_FLEXION: { value: 'FINAL_LOCK_FLEXION', label: 'Final lock flexion' },
  FINAL_LOCK_ROTATION: { value: 'FINAL_LOCK_ROTATION', label: 'Final lock rotation' },
  MANDIBULAR_ANGLE_TECHNIQUE: { value: 'MANDIBULAR_ANGLE_TECHNIQUE', label: 'Mandibular angle technique' },
  SHOULDER_CONTROL: { value: 'SHOULDER_CONTROL', label: 'Shoulder control' },
  THROUGH_RIGID_BAR_CUFFS: { value: 'THROUGH_RIGID_BAR_CUFFS', label: 'Through rigid bar cuffs' },
  THUMB_LOCK: { value: 'THUMB_LOCK', label: 'Thumb lock' },
  UPPER_ARM_CONTROL: { value: 'UPPER_ARM_CONTROL', label: 'Upper arm control' },
}

const RelocationLocation = {
  OWN_CELL: { value: 'OWN_CELL', label: 'Own cell' },
  GATED_CELL: { value: 'GATED_CELL', label: 'Gated cell' },
  SEGREGATION_UNIT: { value: 'SEGREGATION_UNIT', label: 'Segregation unit' },
  SPECIAL_ACCOMODATION: { value: 'SPECIAL_ACCOMODATION', label: 'Special accomodation' },
  CELLULAR_VEHICLE: { value: 'CELLULAR_VEHICLE', label: 'Cellular vehicle' },
}

const ReportStatus = {
  IN_PROGRESS: { value: 'IN_PROGRESS', label: 'In progress' },
  SUBMITTED: { value: 'SUBMITTED', label: 'Submitted' },
  COMPLETE: { value: 'COMPLETE', label: 'Complete' },
}

const StatementStatus = {
  PENDING: { value: 'PENDING', label: 'Pending' },
  SUBMITTED: { value: 'SUBMITTED', label: 'Submitted' },
}

const Destinations = {
  CONTINUE: 'continue',
  TASKLIST: 'back-to-task-list',
  CHECK_YOUR_ANSWERS: 'check-your-answers',
}

const RelocationType = {
  SIDE: { value: 'SIDE', label: 'Side relocation' },
  FULL: { value: 'FULL', label: 'Full relocation' },
  VEHICLE: { value: 'VEHICLE', label: 'Relocated to vehicle' },
}

module.exports = {
  BodyWornCameras: Object.freeze(BodyWornCameras),
  Cctv: Object.freeze(Cctv),
  ControlAndRestraintPosition: Object.freeze(ControlAndRestraintPosition),
  PainInducingTechniques: Object.freeze(PainInducingTechniques),
  RelocationLocation: Object.freeze(RelocationLocation),
  ReportStatus: Object.freeze(ReportStatus),
  StatementStatus: Object.freeze(StatementStatus),
  Destinations: Object.freeze(Destinations),
  toLabel,
  RelocationType: Object.freeze(RelocationType),
}
