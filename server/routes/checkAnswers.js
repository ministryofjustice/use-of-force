const express = require('express')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const asyncMiddleware = require('../middleware/asyncMiddleware')

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
      const { id, form_response: formObject = {} } = await incidentService.getCurrentDraftIncident(
        req.user.username,
        bookingId
      )
      const formData = formObject.incident || {}

      const { description = '' } = await offenderService.getLocation(
        res.locals.user.token,
        formData.newIncident && formData.newIncident.locationId
      )

      const involvedStaff = id ? await incidentService.getInvolvedStaff(id) : []

      const data = {
        newIncident: createNewIncidentObj(offenderDetail, description, formData.newIncident, involvedStaff),
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
      const incidentId = await incidentService.submitForm(req.user.username, bookingId)
      const location = incidentId ? `/submitted/${incidentId}` : `/incidents`
      return res.redirect(location)
    })
  )

  return router
}

const getRestraintPositions = positions => {
  if (Array.isArray(positions)) {
    return `Yes - ${positions.join(', ')}`
  }
  if (positions) {
    return `Yes - ${positions}`
  }
  return ''
}

const convertArrayOfObjectsToStringUsingSpecifiedKey = (attr, dataArray = []) => {
  return dataArray.map(element => element[attr]).join(', ')
}

const staffTakenToHospital = (staffMembers = []) => {
  const hospitalisedStaff = staffMembers.filter(staff => staff.hospitalisation === 'Yes').map(staff => staff.name)
  if (hospitalisedStaff.length === 0 && staffMembers.length > 0) {
    return ''
  }
  return hospitalisedStaff.join(', ')
}

const baggedAndTaggedEvidence = (tagsAndEvidence = [], evidenceYesNo = '') => {
  if (evidenceYesNo === 'No') {
    return 'No'
  }
  return tagsAndEvidence.map(item => {
    return { tag: item.evidenceTagReference, description: item.description }
  })
}

const howManyOfficersInvolved = guidingHoldOfficersInvolved => {
  return guidingHoldOfficersInvolved === 'one' ? '- one officer involved' : '- two officers involved'
}

const typeOfHandcuffsUsed = handcuffsType => {
  return handcuffsType === 'ratchet' ? 'ratchet' : 'fixed bar'
}

const createNewIncidentObj = (offenderDetail, description, newIncident = {}, involvedStaff) => {
  return {
    offenderName: offenderDetail.displayName,
    offenderNumber: offenderDetail.offenderNo,
    location: description,
    forceType: newIncident.forceType,
    staffInvolved: convertArrayOfObjectsToStringUsingSpecifiedKey('name', involvedStaff),
    witnesses: convertArrayOfObjectsToStringUsingSpecifiedKey('name', newIncident.witnesses),
  }
}

const createDetailsObj = (details = {}) => {
  return {
    positiveCommunicationUsed: details.positiveCommunication,
    personalProtectionTechniques: details.personalProtectionTechniques,
    batonDrawn: whenPresent(details.batonDrawn, value => (value === 'Yes' ? wasWeaponUsed(details.batonUsed) : 'No')),
    pavaDrawn: whenPresent(details.pavaDrawn, value => (value === 'Yes' ? wasWeaponUsed(details.pavaUsed) : 'No')),
    guidingHoldUsed: whenPresent(details.guidingHold, value =>
      value === 'Yes' ? `Yes ${howManyOfficersInvolved(details.guidingHoldOfficersInvolved)}` : 'No'
    ),
    controlAndRestraintUsed: whenPresent(details.restraint, value =>
      details.restraintPositions && value === 'Yes' ? getRestraintPositions(details.restraintPositions) : undefined
    ),
    handcuffsUsed: whenPresent(details.handcuffsApplied, value =>
      value === 'Yes' ? typeOfHandcuffsUsed(details.handcuffsType) : 'No'
    ),
  }
}

const createRelocationObj = (relocationAndInjuries = {}) => {
  return {
    prisonerRelocation: relocationAndInjuries.prisonerRelocation,
    prisonerCompliancy: relocationAndInjuries.relocationCompliancy,
    healthcareStaffPresent: whenPresent(relocationAndInjuries.healthcareInvolved, value =>
      value === 'Yes' ? `${relocationAndInjuries.healthcarePractionerName}` : 'No'
    ),
    f213CompletedBy: relocationAndInjuries.f213CompletedBy,
    prisonerHospitalisation: relocationAndInjuries.prisonerHospitalisation,
    staffMedicalAttention: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
      value === 'Yes'
        ? `${convertArrayOfObjectsToStringUsingSpecifiedKey(
            'name',
            relocationAndInjuries.staffNeedingMedicalAttention
          )}`
        : 'No'
    ),
    staffHospitalisation: staffTakenToHospital(relocationAndInjuries.staffNeedingMedicalAttention),
  }
}

const createEvidenceObj = (evidence = {}) => {
  return {
    evidenceBaggedTagged: baggedAndTaggedEvidence(evidence.evidenceTagAndDescription, evidence.baggedEvidence),
    photographs: evidence.photographsTaken,
    cctv: evidence.cctvRecording,
    bodyCameras: whenPresent(evidence.bodyWornCamera, value =>
      value === 'Yes'
        ? `${convertArrayOfObjectsToStringUsingSpecifiedKey('cameraNum', evidence.bodyWornCameraNumbers)}`
        : value
    ),
  }
}

const whenPresent = (value, present) => (!value ? undefined : present(value))

const wasWeaponUsed = WeaponUsed => {
  switch (WeaponUsed) {
    case undefined:
      return undefined
    case 'Yes':
      return 'Yes - and used'
    default:
      return 'Yes - and not used'
  }
}
