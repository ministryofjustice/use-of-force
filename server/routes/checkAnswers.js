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
    return positions.join(', ')
  }
  if (positions) {
    return positions
  }
  return ''
}

const convertArrayOfObjectsToStringUsingSpecifiedKey = (attr, dataArray = []) => {
  return dataArray.map(element => element[attr]).join(', ')
}

const toTitleCase = (str = '') => {
  return str.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const staffTakenToHospital = (staffMembers = []) => {
  const hospitalisedStaff = staffMembers.filter(staff => staff.hospitalisation === 'Yes').map(staff => staff.name)
  if (hospitalisedStaff.length === 0 && staffMembers.length > 0) {
    return ''
  }
  return toTitleCase(hospitalisedStaff.join(', '))
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
    'Offender name': offenderDetail.displayName,
    'Offender number': offenderDetail.offenderNo,
    Location: description,
    'Use of force planned': newIncident.forceType,
    'Staff involved': toTitleCase(convertArrayOfObjectsToStringUsingSpecifiedKey('name', involvedStaff)),
    Witnesses: toTitleCase(convertArrayOfObjectsToStringUsingSpecifiedKey('name', newIncident.witnesses)),
  }
}

const createDetailsObj = (details = {}) => {
  return {
    'Positive communication used': details.positiveCommunication,
    'Personal Protection Techniques': details.personalProtectionTechniques,
    'Baton drawn': whenPresent(details.batonDrawn, value =>
      value === 'Yes' ? wasWeaponUsed(details.batonUsed) : 'No'
    ),
    'PAVA drawn': whenPresent(details.pavaDrawn, value => (value === 'Yes' ? wasWeaponUsed(details.pavaUsed) : 'No')),
    'Guiding hold used': whenPresent(details.guidingHold, value =>
      value === 'Yes' ? `Yes ${howManyOfficersInvolved(details.guidingHoldOfficersInvolved)}` : 'No'
    ),
    'Control and restraint used': whenPresent(details.restraint, value =>
      value === 'Yes' ? `Yes - ${getRestraintPositions(details.restraintPositions)}` : 'No'
    ),
    'Handcuffs used': whenPresent(details.handcuffsApplied, value =>
      value === 'Yes' ? typeOfHandcuffsUsed(details.handcuffsType) : 'No'
    ),
  }
}

const createRelocationObj = (relocationAndInjuries = {}) => {
  return {
    'Prisoner relocated to': relocationAndInjuries.prisonerRelocation,
    'Relocation compliancy': relocationAndInjuries.relocationCompliancy,
    'HealthCare staff present': whenPresent(relocationAndInjuries.healthcareInvolved, value =>
      value === 'Yes' ? `${toTitleCase(relocationAndInjuries.healthcarePractionerName)}` : 'No'
    ),
    'F213 completed by': toTitleCase(relocationAndInjuries.f213CompletedBy),
    'Prisoner required hospitalisation': relocationAndInjuries.prisonerHospitalisation,
    'Staff needed medical attention': whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
      value === 'Yes'
        ? `${toTitleCase(
            convertArrayOfObjectsToStringUsingSpecifiedKey('name', relocationAndInjuries.staffNeedingMedicalAttention)
          )}`
        : 'No'
    ),
    'Staff taken to hospital': staffTakenToHospital(relocationAndInjuries.staffNeedingMedicalAttention),
  }
}

const createEvidenceObj = (evidence = {}) => {
  return {
    'Evidence bagged and tagged': baggedAndTaggedEvidence(evidence.evidenceTagAndDescription, evidence.baggedEvidence),
    'Photographs taken': evidence.photographsTaken,
    'CCTV images': evidence.cctvRecording,
    'Body worn cameras': whenPresent(evidence.bodyWornCamera, value =>
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
