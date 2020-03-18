const {
  BodyWornCameras,
  Cctv,
  RelocationLocation,
  ControlAndRestraintPosition,
  RelocationType,
  toLabel,
} = require('../../config/types')
const { properCaseFullName } = require('../../utils/utils')

const createIncidentDetails = (offenderDetail, description, incidentDetails = {}, involvedStaff, incidentDate) => {
  return {
    offenderName: offenderDetail.displayName,
    offenderNumber: offenderDetail.offenderNo,
    location: description,
    plannedUseOfForce: incidentDetails.plannedUseOfForce,
    staffInvolved: involvedStaff,
    witnesses: incidentDetails.witnesses
      ? incidentDetails.witnesses.map(staff => [properCaseFullName(staff.name)])
      : 'None',
    incidentDate,
  }
}

const createUseOfForceDetails = (details = {}) => {
  return {
    positiveCommunicationUsed: details.positiveCommunication,
    personalProtectionTechniques: details.personalProtectionTechniques,
    batonDrawn: whenPresent(details.batonDrawn, value => (value ? wasWeaponUsed(details.batonUsed) : 'No')),
    pavaDrawn: whenPresent(details.pavaDrawn, value => (value ? wasWeaponUsed(details.pavaUsed) : 'No')),
    guidingHoldUsed: whenPresent(details.guidingHold, value =>
      value ? howManyOfficersInvolved(details.guidingHoldOfficersInvolved) : 'No'
    ),
    controlAndRestraintUsed: whenPresent(details.restraint, value =>
      value === true && details.restraintPositions ? getRestraintPositions(details.restraintPositions) : 'No'
    ),
    painInducingTechniques: details.painInducingTechniques,
    handcuffsApplied: details.handcuffsApplied,
  }
}

const createRelocation = (relocationAndInjuries = {}) => {
  return {
    prisonerRelocation: toLabel(RelocationLocation, relocationAndInjuries.prisonerRelocation),

    relocationCompliancy:
      relocationAndInjuries.relocationCompliancy === true
        ? 'Yes'
        : `No${getRelocationType(relocationAndInjuries.relocationType)}`,

    healthcareStaffPresent: whenPresent(relocationAndInjuries.healthcareInvolved, value =>
      value ? relocationAndInjuries.healthcarePractionerName || 'Yes' : 'No'
    ),
    prisonerInjuries: relocationAndInjuries.prisonerInjuries,
    f213CompletedBy: relocationAndInjuries.f213CompletedBy,
    prisonerHospitalisation: relocationAndInjuries.prisonerHospitalisation,
    staffMedicalAttention: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
      value ? relocationAndInjuries.staffNeedingMedicalAttention.map(staff => [properCaseFullName(staff.name)]) : 'None'
    ),
    staffHospitalisation: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
      value ? staffTakenToHospital(relocationAndInjuries.staffNeedingMedicalAttention) : 'None'
    ),
  }
}

const getRelocationType = relocationType => {
  return relocationType ? ` - ${toLabel(RelocationType, relocationType).toLowerCase()}` : ''
}

const createEvidence = (evidence = {}) => {
  return {
    evidenceBaggedTagged: baggedAndTaggedEvidence(evidence.evidenceTagAndDescription, evidence.baggedEvidence),
    photographs: evidence.photographsTaken,
    cctv: toLabel(Cctv, evidence.cctvRecording),
    bodyCameras: whenPresent(evidence.bodyWornCamera, value =>
      value === Cctv.YES.value
        ? `Yes - ${extractCommaSeparatedList('cameraNum', evidence.bodyWornCameraNumbers)}` || 'Yes'
        : toLabel(BodyWornCameras, value)
    ),
  }
}

const whenPresent = (value, present) => (value == null ? undefined : present(value))

const wasWeaponUsed = weaponUsed => {
  if (weaponUsed == null) {
    return undefined
  }
  return weaponUsed ? 'Yes and used' : 'Yes and not used'
}

const getRestraintPositions = positions => {
  return positions == null ? '' : `Yes - ${positions.map(pos => toLabel(ControlAndRestraintPosition, pos)).join(', ')}`
}

const staffTakenToHospital = (staffMembers = []) => {
  const hospitalisedStaff = staffMembers.filter(staff => staff.hospitalisation === true)
  if (hospitalisedStaff.length === 0) {
    return 'None'
  }
  return hospitalisedStaff.map(staff => [properCaseFullName(staff.name)])
}

const baggedAndTaggedEvidence = (tagsAndEvidence = [], evidenceYesNo = false) => {
  if (evidenceYesNo === false) {
    return 'No'
  }
  return tagsAndEvidence.map(item => {
    return [item.evidenceTagReference, item.description]
  })
}

const howManyOfficersInvolved = guidingHoldOfficersInvolved => {
  return guidingHoldOfficersInvolved === 1 ? 'Yes - 1 officer involved' : 'Yes - 2 officers involved'
}

const extractCommaSeparatedList = (attr, dataArray = []) => {
  return dataArray.map(element => element[attr]).join(', ')
}

module.exports = (form, offenderDetail, locationDescription, involvedStaff, incidentDate) => {
  const { incidentDetails, useOfForceDetails, relocationAndInjuries, evidence } = form
  return {
    incidentDetails: createIncidentDetails(
      offenderDetail,
      locationDescription,
      incidentDetails,
      involvedStaff,
      incidentDate
    ),
    offenderDetail,
    useOfForceDetails: createUseOfForceDetails(useOfForceDetails),
    relocationAndInjuries: createRelocation(relocationAndInjuries),
    evidence: createEvidence(evidence),
  }
}
