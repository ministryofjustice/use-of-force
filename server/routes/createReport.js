const moment = require('moment')
const { isNilOrEmpty, firstItem } = require('../utils/utils')
const { getPathFor } = require('../utils/routes')
const types = require('../config/types')
const { processInput, mergeIntoPayload } = require('../services/validation')
const { paths, full, partial } = require('../config/incident')

const renderForm = ({ req, res, form, formName, data = {}, editMode }) => {
  const { bookingId } = req.params
  const pageData = firstItem(req.flash('userInput')) || form[formName]
  const errors = req.flash('errors')
  res.render(`formPages/incident/${formName}`, {
    data: { bookingId, ...pageData, ...data, types },
    formName,
    errors,
    editMode,
  })
}

const getDestination = ({ editMode, saveAndContinue }) => {
  if (editMode) {
    return types.Destinations.CHECK_YOUR_ANSWERS
  }
  return saveAndContinue ? types.Destinations.CONTINUE : types.Destinations.TASKLIST
}

module.exports = function NewIncidentRoutes({ reportService, offenderService, involvedStaffService }) {
  const loadForm = async req => {
    const { bookingId } = req.params
    const { id: formId, incidentDate, form = {} } = await reportService.getCurrentDraft(req.user.username, bookingId)
    return { formId, incidentDate, form }
  }

  const verifyInvolvedStaff = async (res, form, { involvedStaff = [] }) => {
    if (form !== 'incidentDetails') {
      return {}
    }

    const verifiedInvolvedStaff = await involvedStaffService.lookup(
      res.locals.user.token,
      involvedStaff.map(u => u.username)
    )
    return { additionalFields: { involvedStaff: verifiedInvolvedStaff } }
  }

  const getSubmitRedirectLocation = async (req, payloadFields, form, bookingId, editMode, saveAndContinue) => {
    const { username } = req.user

    if (
      form === 'incidentDetails' &&
      payloadFields.involvedStaff &&
      payloadFields.involvedStaff.some(staff => staff.missing)
    ) {
      req.flash('nextDestination', getDestination({ editMode, saveAndContinue }))
      return `/report/${bookingId}/username-does-not-exist`
    }

    if (editMode) {
      return `/report/${bookingId}/check-your-answers`
    }

    if (form === 'evidence' && !(await reportService.isDraftComplete(username, bookingId))) {
      return `/report/${bookingId}/report-use-of-force`
    }

    const nextPath = getPathFor({ data: payloadFields, config: paths[form] })(bookingId)
    return saveAndContinue ? nextPath : `/report/${bookingId}/report-use-of-force`
  }

  const getIncidentDate = (savedValue, formValue) => {
    if (formValue) {
      const {
        raw: { day, month, year, time },
      } = formValue

      const value = moment({
        years: year,
        months: month - 1,
        date: day,
      })
      return { day, month, year, time, value: value.isValid() ? value.toDate() : null }
    }

    const date = savedValue ? moment(savedValue) : moment()
    const day = date.format('D')
    const month = date.format('M')
    const year = date.format('YYYY')
    const time = date.format('HH:mm')

    return { day, month, year, time, value: date.toDate() }
  }

  const viewIncidentDetails = editMode => async (req, res) => {
    const { bookingId } = req.params
    const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
    const { displayName, offenderNo, locations } = offenderDetail

    const { formId, form, incidentDate = moment() } = await loadForm(req)

    const input = firstItem(req.flash('userInput'))

    const involvedStaff =
      (input && input.involvedStaff) || (formId && (await involvedStaffService.getDraftInvolvedStaff(formId))) || []

    const data = {
      ...input,
      displayName,
      offenderNo,
      incidentDate: getIncidentDate(incidentDate, input && input.incidentDate),
      locations,
      involvedStaff,
    }

    renderForm({ req, res, form, data, formName: 'incidentDetails', editMode })
  }

  const view = (formName, editMode) => async (req, res) => {
    const { form } = await loadForm(req)
    renderForm({ req, res, form, formName, editMode })
  }

  const submit = (formName, editMode) => async (req, res) => {
    const { bookingId } = req.params
    const saveAndContinue = req.body.submit === 'save-and-continue'

    const fullValidation = editMode || saveAndContinue

    const { payloadFields, extractedFields, errors } = processInput({
      validationSpec: fullValidation ? full[formName] : partial[formName],
      input: req.body,
    })

    const { additionalFields = {} } = await verifyInvolvedStaff(res, formName, payloadFields)

    const formPayload = { ...payloadFields, ...additionalFields }
    /**
     * Now formPayload is payloadFields with the involvedStaff field (if it exists) containing verified usernammes. That is,
     * instead of { involvedStaff: [{ username }, ...]} we have
     * { involvedStaff: [{ username, name, email, staffId,  missing }, ...] }
     *
     * Where username will always be present, but email, staffId, missing are optional, depending on whether or not
     * username was verified.
     */

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      req.flash('userInput', { ...formPayload, ...extractedFields }) // merge all fields back together!
      return res.redirect(req.originalUrl)
    }

    /**
     * fetch latest persisted version of form from db for req.params.bookingId, req.user.username
     */
    const { formId, form } = await loadForm(req)

    /** mergeIntoPayload returns false if no change, or merges formPayload onto the persisted form.
     * like so: { ...form, [formName]: formPayload }
     */
    const updatedPayload = mergeIntoPayload({
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

    const location = await getSubmitRedirectLocation(req, formPayload, formName, bookingId, editMode, saveAndContinue)
    return res.redirect(location)
  }

  return {
    viewIncidentDetails: ({ edit }) => viewIncidentDetails(edit),

    viewUsernameDoesNotExist: async (req, res) => {
      const { bookingId } = req.params
      const { formId } = await loadForm(req)
      const involvedStaff = (formId && (await involvedStaffService.getDraftInvolvedStaff(formId))) || []
      const missingUsers = involvedStaff.filter(staff => staff.missing).map(staff => staff.username)
      if (!missingUsers.length) {
        return res.redirect(`/report/${bookingId}/incident-details`)
      }
      const nextDestination = req.flash('nextDestination')
      return res.render(`formPages/incident/username-does-not-exist`, {
        data: { bookingId, missingUsers, nextDestination },
      })
    },

    submitUsernameDoesNotExist: async (req, res) => {
      const { bookingId } = req.params
      const { formId } = await loadForm(req)
      const nextDestination = req.body.nextDestination || types.Destinations.TASKLIST

      if (formId) {
        await involvedStaffService.removeMissingDraftInvolvedStaff(req.user.username, parseInt(bookingId, 10))
      }

      switch (nextDestination) {
        case types.Destinations.TASKLIST: {
          return res.redirect(`/report/${bookingId}/report-use-of-force`)
        }
        case types.Destinations.CONTINUE: {
          return res.redirect(`/report/${bookingId}/use-of-force-details`)
        }
        case types.Destinations.CHECK_YOUR_ANSWERS: {
          return res.redirect(`/report/${bookingId}/check-your-answers`)
        }
        default:
          throw new Error(`unexpected state: ${nextDestination}`)
      }
    },

    view: formName => view(formName, false),

    viewEdit: formName => view(formName, true),

    submit: formName => submit(formName, false),

    submitEdit: formName => submit(formName, true),

    cancelEdit: async (req, res) => {
      const { bookingId, formName } = req.params

      const {
        form: { incidentDetails: { involvedStaff = [] } = {} },
      } = await loadForm(req)

      const hasMissingStaff =
        formName === 'incidentDetails' && involvedStaff && involvedStaff.some(staff => staff.missing)

      req.flash('nextDestination', getDestination({ editMode: true, saveAndContinue: false }))

      const location = hasMissingStaff
        ? `/report/${bookingId}/username-does-not-exist`
        : `/report/${bookingId}/check-your-answers`
      return res.redirect(location)
    },
  }
}
