import moment from 'moment'
import { RequestHandler } from 'express'
import { isNilOrEmpty, firstItem } from '../utils/utils'
import { getPathFor } from '../utils/routes'
import types from '../config/types'
import { processInput, mergeIntoPayload } from '../services/validation'
import { paths, full, partial } from '../config/incident'
import ReportService from '../services/reportService'
import OffenderService from '../services/offenderService'
import { SystemToken } from '../types/uof'
import LocationService from '../services/locationService'

const formName = 'incidentDetails'

const renderForm = ({ req, res, form, data = {}, editMode }) => {
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

const SubmitType = {
  SAVE_AND_CONTINUE: 'save-and-continue',
  SAVE_AND_RETURN: 'save-and-return',
  SAVE_AND_CHANGE_PRISON: 'save-and-change-prison',
}

const getFromFlash = (req, name) => {
  const result = req.flash(name)
  return result.length !== 0 ? result[0] : null
}

const getDestination = ({ editMode, saveAndContinue }) => {
  if (editMode) {
    return types.Destinations.CHECK_YOUR_ANSWERS
  }
  return saveAndContinue ? types.Destinations.CONTINUE : types.Destinations.TASKLIST
}

export default class IncidentDetailsRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly offenderService: OffenderService,
    private readonly involvedStaffService,
    private readonly systemToken: SystemToken,
    private readonly locationService: LocationService
  ) {}

  private loadForm = async req => {
    const { bookingId } = req.params
    const { id: formId, incidentDate, form = {}, agencyId } = await this.reportService.getCurrentDraft(
      req.user.username,
      bookingId
    )
    return { formId, incidentDate, form, agencyId }
  }

  private retrieveInvolvedStaffDetails = async (res, involvedStaff = []) => {
    const verifiedInvolvedStaff = await this.involvedStaffService.lookup(
      await this.systemToken(res.locals.user.username),
      involvedStaff.map(u => u.username)
    )
    return verifiedInvolvedStaff
  }

  private getSubmitRedirectLocation = (req, payloadFields, form, bookingId, editMode, submitType) => {
    if (submitType === SubmitType.SAVE_AND_CHANGE_PRISON) {
      return editMode ? `/report/${bookingId}/edit-change-prison` : `/report/${bookingId}/change-prison`
    }

    if (
      payloadFields.involvedStaff &&
      payloadFields.involvedStaff.some(staff => staff.missing || staff.verified === false)
    ) {
      req.flash(
        'nextDestination',
        getDestination({ editMode, saveAndContinue: submitType === SubmitType.SAVE_AND_CONTINUE })
      )
      return `/report/${bookingId}/username-does-not-exist`
    }

    if (editMode) {
      return `/report/${bookingId}/check-your-answers`
    }

    const nextPath = getPathFor({ data: payloadFields, config: paths[form] })(bookingId)

    return submitType === SubmitType.SAVE_AND_CONTINUE ? nextPath : `/report/${bookingId}/report-use-of-force`
  }

  private getIncidentDate = (savedValue: Date, userProvidedValue) => {
    if (userProvidedValue) {
      const {
        date,
        time: { hour, minute },
      } = userProvidedValue
      return { date, hour, minute }
    }
    if (savedValue) {
      const date = moment(savedValue)
      return { date: date.format('DD/MM/YYYY'), hour: date.format('HH'), minute: date.format('mm') }
    }

    return null
  }

  private viewIncidentDetails = editMode => async (req, res) => {
    const { bookingId } = req.params
    const { formId, form, incidentDate, agencyId: persistedAgencyId } = await this.loadForm(req)

    const token = await this.systemToken(res.locals.user.username)
    const offenderDetail = await this.offenderService.getOffenderDetails(token, bookingId)

    // If report has been created, use persisted agency Id which is robust against offender moving establishments
    const prisonId = persistedAgencyId || offenderDetail.agencyId
    const locations = await this.locationService.getIncidentLocations(token, prisonId)

    const { displayName, offenderNo } = offenderDetail

    const input = firstItem(req.flash('userInput'))

    const involvedStaff =
      (input && input.involvedStaff) ||
      (formId && (await this.involvedStaffService.getDraftInvolvedStaff(formId))) ||
      []

    const prison = await this.locationService.getPrisonById(token, prisonId)

    const data = {
      ...input,
      displayName,
      offenderNo,
      incidentDate: this.getIncidentDate(incidentDate, input && input.incidentDate),
      locations,
      involvedStaff,
      prison,
    }

    renderForm({ req, res, form, data, editMode })
  }

  private submit = editMode => async (req, res) => {
    const { bookingId } = req.params
    const { submitType } = req.body

    const fullValidation = submitType === SubmitType.SAVE_AND_CONTINUE

    const { payloadFields, extractedFields, errors } = processInput({
      validationSpec: fullValidation ? full[formName] : partial[formName],
      input: req.body,
    })
    const { incidentDate } = extractedFields

    const involvedStaff = await this.retrieveInvolvedStaffDetails(res, payloadFields.involvedStaff)

    const formPayload = { ...payloadFields, involvedStaff }
    /**
     * Involved staff will now be overriden in the form with retrieved details from auth:
     * { involvedStaff: [{ username }, ...]}  =>
     * { involvedStaff: [{ username, name, email?, staffId?,  missing }, ...] }
     */

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      req.flash('userInput', { ...formPayload, incidentDate }) // merge all fields back together!
      return res.redirect(req.originalUrl)
    }

    const { formId, form } = await this.loadForm(req)

    const updatedPayload = mergeIntoPayload({
      formObject: form,
      formPayload,
      formName,
    })

    if (updatedPayload || incidentDate) {
      await this.reportService.update({
        currentUser: res.locals.user,
        formId,
        bookingId: parseInt(bookingId, 10),
        formObject: updatedPayload || {},
        incidentDate,
      })
    }

    const location = this.getSubmitRedirectLocation(req, formPayload, formName, bookingId, editMode, submitType)
    return res.redirect(location)
  }

  private getLocationForDestination = (bookingId, nextDestination) => {
    switch (nextDestination) {
      case types.Destinations.TASKLIST: {
        return `/report/${bookingId}/report-use-of-force`
      }
      case types.Destinations.CONTINUE: {
        return `/report/${bookingId}/use-of-force-details`
      }
      case types.Destinations.CHECK_YOUR_ANSWERS: {
        return `/report/${bookingId}/check-your-answers`
      }
      default:
        return `/report/${bookingId}/incident-details`
    }
  }

  public viewIncidentDetailsForm: RequestHandler = this.viewIncidentDetails(false)

  public viewEditIncidentDetailsForm: RequestHandler = this.viewIncidentDetails(true)

  public submitForm: RequestHandler = this.submit(false)

  public submitEditForm: RequestHandler = this.submit(true)

  public cancelEdit: RequestHandler = async (req, res) => {
    const { bookingId } = req.params
    const {
      form: { incidentDetails: { involvedStaff = [] } = {} },
    } = await this.loadForm(req)

    const hasMissingStaff = involvedStaff && involvedStaff.some(staff => staff.missing || staff.verified === false)

    req.flash('nextDestination', getDestination({ editMode: true, saveAndContinue: false }))

    const location = hasMissingStaff
      ? `/report/${bookingId}/username-does-not-exist`
      : `/report/${bookingId}/check-your-answers`
    return res.redirect(location)
  }

  public viewUsernameDoesNotExist: RequestHandler = async (req, res) => {
    const { bookingId } = req.params
    const { formId } = await this.loadForm(req)
    const involvedStaff = (formId && (await this.involvedStaffService.getDraftInvolvedStaff(formId))) || []
    const missingUsers = involvedStaff.filter(staff => staff.missing).map(staff => staff.username)
    const nextDestination = getFromFlash(req, 'nextDestination')

    if (!missingUsers.length) {
      const nextLocation = this.getLocationForDestination(bookingId, nextDestination)
      return res.redirect(nextLocation)
    }
    return res.render(`formPages/incident/username-does-not-exist`, {
      data: { bookingId, missingUsers, nextDestination },
    })
  }

  public submitUsernameDoesNotExist: RequestHandler = async (req, res) => {
    const { bookingId } = req.params
    const { formId } = await this.loadForm(req)
    const nextDestination = req.body.nextDestination || types.Destinations.TASKLIST

    if (formId) {
      await this.involvedStaffService.removeMissingDraftInvolvedStaff(req.user.username, parseInt(bookingId, 10))
    }
    const nextLocation = this.getLocationForDestination(bookingId, nextDestination)
    return res.redirect(nextLocation)
  }
}
