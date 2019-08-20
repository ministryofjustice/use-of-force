const express = require('express')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const moment = require('moment')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { BodyWornCameras, Cctv, RelocationLocation, ControlAndRestraintPosition, toLabel } = require('../config/types')

module.exports = function Index({ incidentService, authenticationMiddleware, offenderService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())
  router.use(bodyParser.urlencoded({ extended: false }))

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const errors = req.flash('errors')
      const { bookingId } = req.params
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
      const {
        id,
        form_response: formObject = {},
        incident_date: incidentDate,
      } = await incidentService.getCurrentDraftIncident(req.user.username, bookingId)
      const formData = formObject.incident || {}

      const { description = '' } = await offenderService.getLocation(
        res.locals.user.token,
        formData.newIncident && formData.newIncident.locationId
      )

      const involvedStaff = id ? await incidentService.getInvolvedStaff(id) : []

      const data = {
        newIncident: createNewIncidentObj(
          offenderDetail,
          description,
          formData.newIncident,
          involvedStaff,
          incidentDate
        ),
        offenderDetail,
        details: createDetailsObj(formData.details),
        relocationAndInjuries: createRelocationObj(formData.relocationAndInjuries),
        evidence: createEvidenceObj(formData.evidence),
      }

      res.render('pages/check-answers', { data, bookingId, errors })
    })
  )

  router.post(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const { confirmed } = req.body
      if (!confirmed) {
        req.flash('errors', [
          {
            text: 'Check that you agree before submitting',
            href: '#confirm',
          },
        ])
        return res.redirect(`/check-answers/${bookingId}`)
      }
      const reportId = await incidentService.submitForm(req.user.username, bookingId)
      const location = reportId ? `/submitted/${reportId}` : `/incidents`
      return res.redirect(location)
    })
  )

  return router
}

const createNewIncidentObj = (offenderDetail, description, newIncident = {}, involvedStaff, incidentDate) => {
  return {
    offenderName: offenderDetail.displayName,
    offenderNumber: offenderDetail.offenderNo,
    location: description,
    plannedUseOfForce: whenPresent(newIncident.plannedUseOfForce, value => (value ? 'Planned' : 'Spontaneous')),
    staffInvolved: extractCommaSeparatedList('name', involvedStaff),
    witnesses: extractCommaSeparatedList('name', newIncident.witnesses),
    incidentDate: moment(incidentDate).format('DD/MM/YYYY'),
    incidentTime: moment(incidentDate).format('HH:mm'),
  }
}

const createDetailsObj = (details = {}) => {
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
    handcuffsUsed: whenPresent(details.handcuffsApplied, value =>
      value ? typeOfHandcuffsUsed(details.handcuffsType) : 'No'
    ),
  }
}

const createRelocationObj = (relocationAndInjuries = {}) => {
  return {
    prisonerRelocation: toLabel(RelocationLocation, relocationAndInjuries.prisonerRelocation),
    prisonerCompliancy: whenPresent(relocationAndInjuries.relocationCompliancy, value =>
      value ? 'Compliant' : 'Non-compliant'
    ),
    healthcareStaffPresent: whenPresent(relocationAndInjuries.healthcareInvolved, value =>
      value ? relocationAndInjuries.healthcarePractionerName || 'Yes' : 'No'
    ),
    f213CompletedBy: relocationAndInjuries.f213CompletedBy,
    prisonerHospitalisation: relocationAndInjuries.prisonerHospitalisation,
    staffMedicalAttention: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
      value ? `${extractCommaSeparatedList('name', relocationAndInjuries.staffNeedingMedicalAttention)}` : 'No'
    ),
    staffHospitalisation: staffTakenToHospital(relocationAndInjuries.staffNeedingMedicalAttention),
  }
}

const createEvidenceObj = (evidence = {}) => {
  return {
    evidenceBaggedTagged: baggedAndTaggedEvidence(evidence.evidenceTagAndDescription, evidence.baggedEvidence),
    photographs: evidence.photographsTaken,
    cctv: toLabel(Cctv, evidence.cctvRecording),
    bodyCameras: whenPresent(evidence.bodyWornCamera, value =>
      value === Cctv.YES.value
        ? extractCommaSeparatedList('cameraNum', evidence.bodyWornCameraNumbers) || 'Yes'
        : toLabel(BodyWornCameras, value)
    ),
  }
}

const whenPresent = (value, present) => (value == null ? undefined : present(value))

const wasWeaponUsed = weaponUsed => {
  if (weaponUsed == null) {
    return undefined
  }
  return weaponUsed ? 'Yes - and used' : 'Yes - and not used'
}

const getRestraintPositions = positions => {
  return positions == null ? '' : `Yes - ${positions.map(pos => toLabel(ControlAndRestraintPosition, pos)).join(', ')}`
}

const staffTakenToHospital = (staffMembers = []) => {
  const hospitalisedStaff = staffMembers.filter(staff => staff.hospitalisation === true).map(staff => staff.name)
  if (hospitalisedStaff.length === 0 && staffMembers.length > 0) {
    return 'No'
  }
  return hospitalisedStaff.join(', ')
}

const baggedAndTaggedEvidence = (tagsAndEvidence = [], evidenceYesNo = '') => {
  if (evidenceYesNo === false) {
    return 'No'
  }
  return tagsAndEvidence.map(item => {
    return { tag: item.evidenceTagReference, description: item.description }
  })
}

const howManyOfficersInvolved = guidingHoldOfficersInvolved => {
  return guidingHoldOfficersInvolved === 1 ? 'Yes - one officer involved' : 'Yes - two officers involved'
}

const typeOfHandcuffsUsed = handcuffsType => {
  return handcuffsType === 'RATCHET' ? 'ratchet' : 'fixed bar'
}

const extractCommaSeparatedList = (attr, dataArray = []) => {
  return dataArray.map(element => element[attr]).join(', ')
}
