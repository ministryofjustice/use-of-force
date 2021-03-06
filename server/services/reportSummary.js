const {
  BodyWornCameras,
  Cctv,
  RelocationLocation,
  ControlAndRestraintPosition,
  PainInducingTechniquesUsed,
  RelocationType,
  toLabel,
} = require('../config/types')
const { properCaseFullName } = require('../utils/utils')

const YES = 'Yes'
const NO = 'No'

const createIncidentDetails = (
  offenderDetail,
  prison,
  description,
  incidentDetails = {},
  involvedStaff,
  incidentDate
) => {
  return {
    offenderName: offenderDetail.displayName,
    offenderNumber: offenderDetail.offenderNo,
    prison,
    location: description,
    plannedUseOfForce: incidentDetails.plannedUseOfForce,
    authorisedBy: incidentDetails.authorisedBy,
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
    batonDrawn: whenPresent(details.batonDrawn, value => (value ? wasWeaponUsed(details.batonUsed) : NO)),
    pavaDrawn: whenPresent(details.pavaDrawn, value => (value ? wasWeaponUsed(details.pavaUsed) : NO)),
    guidingHoldUsed: whenPresent(details.guidingHold, value =>
      value ? howManyOfficersInvolved(details.guidingHoldOfficersInvolved) : NO
    ),
    controlAndRestraintUsed: whenPresent(details.restraint, value =>
      value === true && details.restraintPositions ? getRestraintPositions(details.restraintPositions) : NO
    ),

    painInducingTechniques: getPainInducingTechniques(details),
    handcuffsApplied: details.handcuffsApplied,
  }
}

const createRelocation = (relocationAndInjuries = {}) => {
  return {
    prisonerRelocation: toLabel(RelocationLocation, relocationAndInjuries.prisonerRelocation),

    relocationCompliancy:
      relocationAndInjuries.relocationCompliancy === true
        ? YES
        : `${NO}${getRelocationType(relocationAndInjuries.relocationType)}`,

    healthcareStaffPresent: whenPresent(relocationAndInjuries.healthcareInvolved, value =>
      value ? relocationAndInjuries.healthcarePractionerName || YES : NO
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
        ? `${YES} - ${extractCommaSeparatedList('cameraNum', evidence.bodyWornCameraNumbers)}` || YES
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
  return positions == null
    ? ''
    : `${YES} - ${positions.map(pos => toLabel(ControlAndRestraintPosition, pos)).join(', ')}`
}

const getPainInducingTechniques = details => {
  if (details.painInducingTechniques === undefined) {
    return undefined
  }

  if (details.painInducingTechniques && !details.painInducingTechniquesUsed) {
    return YES
  }

  if (details.painInducingTechniques && details.painInducingTechniquesUsed) {
    return `Yes - ${details.painInducingTechniquesUsed
      .map(technique => toLabel(PainInducingTechniquesUsed, technique))
      .join(', ')}`
  }

  return NO
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
    return NO
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

module.exports = (form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate) => {
  const { incidentDetails, useOfForceDetails, relocationAndInjuries, evidence } = form
  return {
    incidentDetails: createIncidentDetails(
      offenderDetail,
      prison,
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
