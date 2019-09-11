const moment = require('moment')
const { isNilOrEmpty, firstItem } = require('../utils/utils')
const { getPathFor } = require('../utils/routes')
const types = require('../config/types')
const formProcessing = require('../services/formProcessing')
const incidentConfig = require('../config/incident')

const formConfig = {
  ...incidentConfig,
}

const renderForm = ({ req, res, form, formName, data = {} }) => {
  const backLink = req.get('Referrer')
  const { bookingId } = req.params
  const pageData = firstItem(req.flash('userInput')) || form[formName]
  const errors = req.flash('errors')
  res.render(`formPages/incident/${formName}`, {
    data: { bookingId, ...pageData, ...data, types },
    formName,
    backLink,
    errors,
  })
}

module.exports = function NewIncidentRoutes({ reportService, offenderService, involvedStaffService }) {
  const loadForm = async req => {
    const { bookingId } = req.params
    const { id: formId, incidentDate, form = {} } = await reportService.getCurrentDraft(req.user.username, bookingId)
    return { formId, incidentDate, form }
  }

  const getAdditonalData = async (res, form, { involvedStaff = [] }) => {
    if (form === 'incidentDetails') {
      return involvedStaffService.lookup(res.locals.user.token, involvedStaff.map(u => u.username))
    }
    return { additionalFields: [], additionalErrors: [] }
  }

  const getSubmitRedirectLocation = async (username, payloadFields, form, bookingId, saveAndContinue) => {
    if (form === 'evidence' && !(await reportService.isDraftComplete(username, bookingId))) {
      return `/report/${bookingId}/report-use-of-force`
    }
    const nextPath = getPathFor({ data: payloadFields, config: formConfig[form] })(bookingId)
    const location = saveAndContinue ? nextPath : `/report/${bookingId}/report-use-of-force`
    return location
  }

  return {
    viewIncidentDetails: async (req, res) => {
      const { bookingId } = req.params
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
      const { displayName, offenderNo, locations } = offenderDetail

      const { formId, form, incidentDate } = await loadForm(req)
      const date = incidentDate ? moment(incidentDate) : moment()

      const input = firstItem(req.flash('userInput'))

      const involvedStaff =
        (input && input.involvedStaff) || (formId && (await involvedStaffService.getDraftInvolvedStaff(formId))) || []

      const data = {
        ...input,
        displayName,
        offenderNo,
        date,
        locations,
        involvedStaff,
      }

      renderForm({ req, res, form, data, formName: 'incidentDetails' })
    },

    view: formName => async (req, res) => {
      const { form } = await loadForm(req)
      renderForm({ req, res, form, formName })
    },

    submit: formName => async (req, res) => {
      const { bookingId } = req.params
      const saveAndContinue = req.body.submit === 'save-and-continue'

      const { fields, validate: validationEnabled } = formConfig[formName]
      const validate = validationEnabled && saveAndContinue

      const { payloadFields, extractedFields, errors } = formProcessing.processInput({ validate, fields }, req.body)

      const { additionalFields = {}, additionalErrors = [] } = await getAdditonalData(res, formName, payloadFields)

      const allErrors = [...errors, ...additionalErrors]
      const formPayload = { ...payloadFields, ...additionalFields }

      if (saveAndContinue && !isNilOrEmpty(allErrors)) {
        req.flash('errors', allErrors)
        req.flash('userInput', formPayload)
        return res.redirect(req.originalUrl)
      }

      const { formId, form } = await loadForm(req)

      const updatedPayload = await formProcessing.mergeIntoPayload({
        formObject: form,
        formPayload,
        formName,
      })

      if (updatedPayload || !isNilOrEmpty(extractedFields)) {
        await reportService.update({
          currentUser: res.locals.user,
          formId,
          bookingId: parseInt(bookingId, 10),
          formObject: updatedPayload || {},
          ...extractedFields,
        })
      }

      const location = await getSubmitRedirectLocation(
        req.user.username,
        payloadFields,
        formName,
        bookingId,
        saveAndContinue
      )
      return res.redirect(location)
    },
  }
}
