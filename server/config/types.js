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

const RelocationLocation = {
  OWN_CELL: { value: 'OWN_CELL', label: 'Own cell' },
  GATED_CELL: { value: 'GATED_CELL', label: 'Gated cell' },
  SEGREGATION_UNIT: { value: 'SEGREGATION_UNIT', label: 'Segregation unit' },
  SPECIAL_ACCOMODATION: { value: 'SPECIAL_ACCOMODATION', label: 'Special Accomodation' },
  CELLULAR_VEHICLE: { value: 'CELLULAR_VEHICLE', label: 'Cellular vehicle' },
}

module.exports = {
  BodyWornCameras: Object.freeze(BodyWornCameras),
  Cctv: Object.freeze(Cctv),
  ControlAndRestraintPosition: Object.freeze(ControlAndRestraintPosition),
  RelocationLocation: Object.freeze(RelocationLocation),
  toLabel,
}
