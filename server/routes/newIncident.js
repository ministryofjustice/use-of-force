const moment = require('moment')
const { getIn, isNilOrEmpty, firstItem } = require('../utils/utils')
const { getPathFor } = require('../utils/routes')
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

module.exports = function NewIncidentRoutes({ reportService, offenderService, involvedStaffService }) {
  const loadForm = async req => {
    const { bookingId } = req.params
    const {
      id: formId,
      incident_date: incidentDate,
      form_response: formObject = {},
    } = await reportService.getCurrentDraft(req.user.username, bookingId)
    return { formId, incidentDate, formObject }
  }

  const getAdditonalData = async (res, form, { involvedStaff = [] }) => {
    if (form === 'newIncident') {
      return involvedStaffService.lookup(res.locals.user.token, involvedStaff.map(u => u.username))
    }
    return { additionalFields: [], additionalErrors: [] }
  }

  return {
    viewNewIncident: async (req, res) => {
      const { bookingId } = req.params
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
      const { displayName, offenderNo, locations } = offenderDetail

      const section = 'incident'
      const form = 'newIncident'

      const { formId, formObject, incidentDate } = await loadForm(req)
      const date = incidentDate ? moment(incidentDate) : moment()

      const input = firstItem(req.flash('userInput'))

      const involvedStaff = (input && input.involvedStaff) || (formId && (await involvedStaffService.get(formId))) || []

      const data = {
        displayName,
        offenderNo,
        date,
        locations,
        involvedStaff,
      }

      renderForm({ req, res, formObject, data, section, form })
    },

    viewReportForm: async (req, res) => {
      const { section, form } = req.params
      const { formObject } = await loadForm(req)
      renderForm({ req, res, formObject, section, form })
    },

    updateReportForm: async (req, res) => {
      const { section, form, bookingId } = req.params

      const { payloadFields, extractedFields, errors } = formProcessing.processInput(formConfig[form], req.body)

      const { additionalFields = {}, additionalErrors = [] } = await getAdditonalData(res, form, payloadFields)

      const allErrors = [...errors, ...additionalErrors]
      const formPayload = { ...payloadFields, ...additionalFields }

      if (!isNilOrEmpty(allErrors)) {
        req.flash('errors', allErrors)
        req.flash('userInput', formPayload)
        return res.redirect(`/form/${section}/${form}/${bookingId}`)
      }

      const { formId, formObject } = await loadForm(req)

      const updatedPayload = await formProcessing.mergeIntoPayload({
        formObject,
        formPayload,
        formSection: section,
        formName: form,
      })

      if (updatedPayload || !isNilOrEmpty(extractedFields)) {
        await reportService.update({
          currentUser: res.locals.user,
          formId,
          bookingId: parseInt(bookingId, 10),
          formObject: updatedPayload,
          ...extractedFields,
        })
      }

      const nextPath = getPathFor({ data: payloadFields, config: formConfig[form] })(bookingId)
      const location = req.body.submit === 'save-and-continue' ? nextPath : `/tasklist/${bookingId}`
      return res.redirect(location)
    },
  }
}
