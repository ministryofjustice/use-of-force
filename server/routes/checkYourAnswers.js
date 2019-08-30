const { BodyWornCameras, Cctv, RelocationLocation, ControlAndRestraintPosition, toLabel } = require('../config/types')
const { properCaseFullName } = require('../utils/utils')

module.exports = function CheckAnswerRoutes({ reportService, offenderService, involvedStaffService }) {
  const createIncidentDetailsObj = (
    currentUser,
    offenderDetail,
    description,
    incidentDetails = {},
    involvedStaff,
    incidentDate
  ) => {
    return {
      offenderName: offenderDetail.displayName,
      offenderNumber: offenderDetail.offenderNo,
      location: description,
      plannedUseOfForce: incidentDetails.plannedUseOfForce,
      staffInvolved: [
        ...involvedStaff.map(staff => [properCaseFullName(staff.name)]),
        ...(involvedStaff.find(staff => staff.username === currentUser.username) ? [] : [[currentUser.displayName]]),
      ],
      witnesses: incidentDetails.witnesses
        ? incidentDetails.witnesses.map(staff => [properCaseFullName(staff.name)])
        : [],
      incidentDate,
    }
  }

  const createUseOfForceDetailsObj = (details = {}) => {
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
    }
  }

  const createRelocationObj = (relocationAndInjuries = {}) => {
    return {
      prisonerRelocation: toLabel(RelocationLocation, relocationAndInjuries.prisonerRelocation),
      prisonerCompliancy: relocationAndInjuries.relocationCompliancy,
      healthcareStaffPresent: whenPresent(relocationAndInjuries.healthcareInvolved, value =>
        value ? relocationAndInjuries.healthcarePractionerName || 'Yes' : 'No'
      ),
      prisonerInjuries: relocationAndInjuries.prisonerInjuries,
      f213CompletedBy: relocationAndInjuries.f213CompletedBy,
      prisonerHospitalisation: relocationAndInjuries.prisonerHospitalisation,
      staffMedicalAttention: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
        value
          ? relocationAndInjuries.staffNeedingMedicalAttention.map(staff => [properCaseFullName(staff.name)])
          : 'None'
      ),
      staffHospitalisation: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
        value ? staffTakenToHospital(relocationAndInjuries.staffNeedingMedicalAttention) : 'None'
      ),
    }
  }

  const createEvidenceObj = (evidence = {}) => {
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
    return positions == null
      ? ''
      : `Yes - ${positions.map(pos => toLabel(ControlAndRestraintPosition, pos)).join(', ')}`
  }

  const staffTakenToHospital = (staffMembers = []) => {
    const hospitalisedStaff = staffMembers.filter(staff => staff.hospitalisation === true)
    if (hospitalisedStaff.length === 0) {
      return 'None'
    }
    return hospitalisedStaff.map(staff => [properCaseFullName(staff.name)])
  }

  const baggedAndTaggedEvidence = (tagsAndEvidence = [], evidenceYesNo = '') => {
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

  return {
    view: async (req, res) => {
      const errors = req.flash('errors')
      const { bookingId } = req.params
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
      const { id, form_response: formData = {}, incident_date: incidentDate } = await reportService.getCurrentDraft(
        req.user.username,
        bookingId
      )

      const { description = '' } = await offenderService.getLocation(
        res.locals.user.token,
        formData.incidentDetails && formData.incidentDetails.locationId
      )

      const involvedStaff = id ? await involvedStaffService.get(id) : []

      const data = {
        incidentDetails: createIncidentDetailsObj(
          res.locals.user,
          offenderDetail,
          description,
          formData.incidentDetails,
          involvedStaff,
          incidentDate
        ),
        offenderDetail,
        useOfForceDetails: createUseOfForceDetailsObj(formData.useOfForceDetails),
        relocationAndInjuries: createRelocationObj(formData.relocationAndInjuries),
        evidence: createEvidenceObj(formData.evidence),
      }

      res.render('pages/check-your-answers', { data, bookingId, errors })
    },

    submit: async (req, res) => {
      const { bookingId } = req.params
      const reportId = await reportService.submit(res.locals.user, bookingId)
      const location = reportId ? `/${reportId}/report-sent` : `/`
      return res.redirect(location)
    },
  }
}
