const express = require('express')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const asyncMiddleware = require('../middleware/asyncMiddleware')

// eslint-disable-next-line
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

      // offender details
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)

      // retrieve form inputs
      // eslint-disable-next-line
      const loadForm = async req => {
        const { form_response: formObject = {}, id: formId } = await formService.getFormResponse(
          req.user.username,
          bookingId
        )
        return { formId, formObject }
      }
      const { formObject } = await loadForm(req, res)

      // parent obj to send to view
      const viewObject = formObject.incident || {}
      viewObject.newIncident = viewObject.newIncident || {}

      const { description = '' } = await offenderService.getLocation(
        res.locals.user.token,
        viewObject.newIncident.locationId
      )

      // new incident object
      const newIncident = {
        'Offender name': offenderDetail.displayName,
        'Offender number': offenderDetail.offenderNo,
        Location: description,
        'Use of force planned': viewObject.newIncident.forceType,
        'Staff involved': toTitleCase(convertArrayOfObjectsToString(viewObject.newIncident.involved)),
        Witnesses: toTitleCase(convertArrayOfObjectsToString(viewObject.newIncident.witnesses)),
      }
      viewObject.newIncident = newIncident
      viewObject.offenderDetail = offenderDetail

      // details object. Initilise to previous values or empty object to prevent 'undefined' errors
      viewObject.details = viewObject.details || {}
      const details = {
        'Positive communication used': viewObject.details.positiveCommunication,
        'Personal Protection Techniques': viewObject.details.personalProtectionTechniques,
        'Baton Drawn':
          viewObject.details.batonDrawn + (viewObject.details.batonUsed === 'Yes' ? ' - and used' : ' - but not used'),
        'Pava drawn':
          viewObject.details.pavaDrawn + (viewObject.details.pavaUsed === 'Yes' ? ' - and used' : ' - but not used'),
        'Guiding hold used':
          viewObject.details.guidingHold +
          (viewObject.details.guidingHold === 'Yes'
            ? howManyOfficersInvolved(viewObject.details.guidingHoldOfficersInvolved)
            : ''),
        'Restraint used':
          viewObject.details.restraint +
          (viewObject.details.restraint === 'Yes'
            ? ` - ${convertNestedArraysToString(viewObject.details.restraintPositions)}`
            : ''),
        'Handcuffs used':
          viewObject.details.handcuffsApplied +
          (viewObject.details.handcuffsApplied === 'Yes' ? typeOfHandcuffsUsed(viewObject.details.handcuffsType) : ''),
      }
      viewObject.details = details

      // relocation object
      viewObject.relocationAndInjuries = viewObject.relocationAndInjuries || {}
      const relocationAndInjuries = {
        'Prisoner relocated to': viewObject.relocationAndInjuries.prisonerRelocation,
        'Relocation compliancy': viewObject.relocationAndInjuries.relocationCompliancy,
        'Healthcare staff present':
          viewObject.relocationAndInjuries.healthcareInvolved +
          (viewObject.relocationAndInjuries.healthcareInvolved === 'Yes'
            ? ` - ${toTitleCase(viewObject.relocationAndInjuries.healthcarePractionerName)}`
            : ''),
        'F213 completed by': toTitleCase(viewObject.relocationAndInjuries.f213CompletedBy),
        'Prisoner required hospitalisation': viewObject.relocationAndInjuries.prisonerHospitalisation,
        'Staff needed medical attention':
          viewObject.relocationAndInjuries.staffMedicalAttention +
          (viewObject.relocationAndInjuries.staffMedicalAttention === 'Yes'
            ? ` - ${toTitleCase(
                convertArrayOfObjectsToString(viewObject.relocationAndInjuries.staffNeedingMedicalAttention)
              )}`
            : ''),
        'Staff taken to hospital': staffTakenToHospital(viewObject.relocationAndInjuries.staffNeedingMedicalAttention),
      }
      viewObject.relocationAndInjuries = relocationAndInjuries

      // evidence object
      viewObject.evidence = viewObject.evidence || {}
      const evidence = {
        'Evidence bagged and tagged': baggedAndTaggedEvidence(
          viewObject.evidence.evidenceTagAndDescription,
          viewObject.evidence.baggedEvidence
        ),
        'Photgraphs taken': viewObject.evidence.photographsTaken,
        'CCTV images': viewObject.evidence.cctvRecording,
        'Body worn cameras':
          viewObject.evidence.bodyWornCamera +
          (viewObject.evidence.bodyWornCamera === 'Yes'
            ? ` - ${convertArrayOfObjectsToString(viewObject.evidence.bodyWornCameraNumbers)}`
            : ''),
      }
      viewObject.evidence = evidence

      res.render('pages/check-answers', { data: viewObject, bookingId, errors })
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

// utility function - convert to string where input MAY be an array

const convertNestedArraysToString = allElements => {
  if (Array.isArray(allElements)) {
    let finalString = ''
    allElements.forEach(element => {
      finalString += `${element}, `
    })
    finalString = finalString.slice(0, -2)
    return finalString
  }
  return allElements
}

// utility function - convert to string when input WILL be nested objects
const convertArrayOfObjectsToString = (dataArray = []) => {
  let finalString = ''
  dataArray.forEach(element => {
    finalString += `${element.name}, `
  })
  return finalString.slice(0, -2)
}

// titlecase all person names
const toTitleCase = (str = '') => {
  return str.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

// staff taken to hospital
const staffTakenToHospital = (staffMembers = []) => {
  const hospitalisedStaff = staffMembers.filter(staff => staff.hospitalisation === 'Yes').map(staff => staff.name)
  if (hospitalisedStaff.length === 0 && staffMembers.length > 0) {
    return 'none'
  }
  return toTitleCase(hospitalisedStaff.join(', '))
}

// evidence bagged
const baggedAndTaggedEvidence = (tagsAndEvidence = [], evidenceYesNo = '') => {
  if (evidenceYesNo === 'No') {
    return 'none'
  }
  return tagsAndEvidence
    .map(item => {
      return `${item.name} ${item.description}`
    })
    .join(`<br/>`)
}

// how many officers involved
const howManyOfficersInvolved = guidingHoldOfficersInvolved => {
  return guidingHoldOfficersInvolved === 'one' ? ' - one officer involved' : ' - two officers involved'
}

// handcuffs used
const typeOfHandcuffsUsed = handcuffsType => {
  return handcuffsType === 'ratchet' ? ' - ratchet' : ' - fixed bar'
}
