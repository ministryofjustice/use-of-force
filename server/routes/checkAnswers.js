const express = require('express')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ formService, authenticationMiddleware, offenderService }) {
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
      const { form_response: formObject = {} } = await formService.getFormResponse(req.user.username, bookingId)
      const formData = formObject.incident || {}

      const { description = '' } = await offenderService.getLocation(
        res.locals.user.token,
        formData.newIncident && formData.newIncident.locationId
      )

      const data = {
        newIncident: createNewIncidentObj(offenderDetail, description, formData.newIncident),
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
      const incidentId = await formService.submitForm(req.user.username, bookingId)
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
    return 'none'
  }
  return toTitleCase(hospitalisedStaff.join(', '))
}

const baggedAndTaggedEvidence = (tagsAndEvidence = [], evidenceYesNo = '') => {
  if (evidenceYesNo === 'No') {
    return 'none'
  }
  return tagsAndEvidence
    .map(item => {
      return `${item.evidenceTagReference}<br/>${item.description}`
    })
    .join(`<br/></br>`)
}

const howManyOfficersInvolved = guidingHoldOfficersInvolved => {
  return guidingHoldOfficersInvolved === 'one' ? ' - one officer involved' : ' - two officers involved'
}

const typeOfHandcuffsUsed = handcuffsType => {
  return handcuffsType === 'ratchet' ? ' - ratchet' : ' - fixed bar'
}

const createNewIncidentObj = (offenderDetail, description, newIncident = {}) => {
  return {
    'Offender name': offenderDetail.displayName,
    'Offender number': offenderDetail.offenderNo,
    Location: description,
    'Use of force planned': newIncident.forceType,
    'Staff involved': toTitleCase(convertArrayOfObjectsToStringUsingSpecifiedKey('name', newIncident.involved)),
    Witnesses: toTitleCase(convertArrayOfObjectsToStringUsingSpecifiedKey('name', newIncident.witnesses)),
  }
}

const createDetailsObj = (details = {}) => {
  return {
    'Positive communication used': details.positiveCommunication,
    'Personal Protection Techniques': details.personalProtectionTechniques,
    'Baton Drawn': details.batonDrawn + (details.batonUsed === 'Yes' ? ' - and used' : ' - but not used'),
    'Pava drawn': details.pavaDrawn + (details.pavaUsed === 'Yes' ? ' - and used' : ' - but not used'),
    'Guiding hold used':
      details.guidingHold +
      (details.guidingHold === 'Yes' ? howManyOfficersInvolved(details.guidingHoldOfficersInvolved) : ''),
    'Restraint used':
      details.restraint +
      (details.restraint === 'Yes' ? ` - ${getRestraintPositions(details.restraintPositions)}` : ''),
    'Handcuffs used':
      details.handcuffsApplied + (details.handcuffsApplied === 'Yes' ? typeOfHandcuffsUsed(details.handcuffsType) : ''),
  }
}

const createRelocationObj = (relocationAndInjuries = {}) => {
  return {
    'Prisoner relocated to': relocationAndInjuries.prisonerRelocation,
    'Relocation compliancy': relocationAndInjuries.relocationCompliancy,
    'Healthcare staff present':
      relocationAndInjuries.healthcareInvolved +
      (relocationAndInjuries.healthcareInvolved === 'Yes'
        ? ` - ${toTitleCase(relocationAndInjuries.healthcarePractionerName)}`
        : ''),
    'F213 completed by': toTitleCase(relocationAndInjuries.f213CompletedBy),
    'Prisoner required hospitalisation': relocationAndInjuries.prisonerHospitalisation,
    'Staff needed medical attention':
      relocationAndInjuries.staffMedicalAttention +
      (relocationAndInjuries.staffMedicalAttention === 'Yes'
        ? ` - ${toTitleCase(
            convertArrayOfObjectsToStringUsingSpecifiedKey('name', relocationAndInjuries.staffNeedingMedicalAttention)
          )}`
        : ''),
    'Staff taken to hospital': staffTakenToHospital(relocationAndInjuries.staffNeedingMedicalAttention),
  }
}

const createEvidenceObj = (evidence = {}) => {
  return {
    'Evidence bagged and tagged': baggedAndTaggedEvidence(evidence.evidenceTagAndDescription, evidence.baggedEvidence),
    'Photographs taken': evidence.photographsTaken,
    'CCTV images': evidence.cctvRecording,
    'Body worn cameras':
      evidence.bodyWornCamera +
      (evidence.bodyWornCamera === 'Yes'
        ? ` - ${convertArrayOfObjectsToStringUsingSpecifiedKey('cameraNum', evidence.bodyWornCameraNumbers)}`
        : ''),
  }
}
