const express = require('express')
const moment = require('moment')
const flash = require('connect-flash')
const { getIn, isNilOrEmpty, firstItem } = require('../utils/utils')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const types = require('../config/types')
const formProcessing = require('../services/formProcessing')

const incidentConfig = require('../config/incident')

const formConfig = {
  ...incidentConfig,
}

const renderForm = ({ req, res, formObject, section, form, data = {} }) => {
  const backLink = req.get('Referrer')
  const { bookingId } = req.params
  const pageData = firstItem(req.flash('userInput')) || getIn([section, form], formObject)
  const errors = req.flash('errors')
  res.render(`formPages/${section}/${form}`, {
    data: { bookingId, ...pageData, ...data, types },
    formName: form,
    backLink,
    errors,
  })
}

module.exports = function Index({ reportService, authenticationMiddleware, offenderService, involvedStaffService }) {
  const loadForm = async req => {
    const { bookingId } = req.params
    const {
      id: formId,
      incident_date: incidentDate,
      form_response: formObject = {},
    } = await reportService.getCurrentDraft(req.user.username, bookingId)
    return { formId, incidentDate, formObject }
  }

  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get(
    '/incident/newIncident/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
      const { displayName, offenderNo, locations } = offenderDetail

      const section = 'incident'
      const form = 'newIncident'

      const { formId, formObject, incidentDate } = await loadForm(req)
      const date = incidentDate ? moment(incidentDate) : moment()

      const dateAndTime = {
        date: date.format('DD/MM/YYYY'),
        time: date.format('HH:mm'),
      }

      const input = firstItem(req.flash('userInput'))

      const involved = (input && input.involved) || (formId && (await reportService.getInvolvedStaff(formId))) || []

      const data = {
        displayName,
        offenderNo,
        dateAndTime,
        locations,
        involved,
      }

      renderForm({ req, res, formObject, data, section, form })
    })
  )

  router.get(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { section, form } = req.params
      const { formObject } = await loadForm(req)
      renderForm({ req, res, formObject, section, form })
    })
  )

  const getAdditonalData = async (res, form, extractedFields) => {
    if (form === 'newIncident' && extractedFields.involved) {
      const result = await involvedStaffService.getInvolvedStaff(
        res.locals.user.token,
        extractedFields.involved.map(u => u.username)
      )
      return result
    }
    return { additionalFields: [], additionalErrors: [] }
  }

  router.post(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { section, form, bookingId } = req.params

      const { payloadFields, extractedFields, errors } = formProcessing.processInput(formConfig[form], req.body)

      const { additionalFields, additionalErrors } = await getAdditonalData(res, form, extractedFields)

      const allErrors = [...errors, ...additionalErrors]
      const allAdditionalFields = { ...extractedFields, ...additionalFields }

      if (!isNilOrEmpty(allErrors)) {
        req.flash('errors', allErrors)
        req.flash('userInput', { ...payloadFields, ...extractedFields })
        return res.redirect(`/form/${section}/${form}/${bookingId}`)
      }

      const { formId, formObject } = await loadForm(req)

      const updatedPayload = await formProcessing.mergeIntoPayload({
        formObject,
        formPayload: payloadFields,
        formSection: section,
        formName: form,
      })

      if (updatedPayload || !isNilOrEmpty(extractedFields)) {
        await reportService.update({
          currentUser: res.locals.user,
          formId,
          bookingId: parseInt(bookingId, 10),
          formObject: updatedPayload,
          ...allAdditionalFields,
        })
      }

      const nextPath = getPathFor({ data: payloadFields, config: formConfig[form] })(bookingId)
      const location = req.body.submit === 'save-and-continue' ? nextPath : `/tasklist/${bookingId}`
      return res.redirect(location)
    })
  )

  return router
}
