import moment from 'moment'
import { Request, RequestHandler, Response } from 'express'
import { isNilOrEmpty, firstItem } from '../utils/utils'
import types from '../config/types'
import { processInput } from '../services/validation'
import { nextPaths, full, partial } from '../config/incident'
import type OffenderService from '../services/offenderService'
import type LocationService from '../services/locationService'
import type DraftReportService from '../services/report/draftReportService'
import type { ParsedDate } from '../utils/dateSanitiser'
import type { SystemToken } from '../types/uof'

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

export default class IncidentDetailsRoutes {
  constructor(
    private readonly draftReportService: DraftReportService,
    private readonly offenderService: OffenderService,
    private readonly systemToken: SystemToken,
    private readonly locationService: LocationService
  ) {}

  private loadForm = async req => {
    const { bookingId } = req.params
    const { id: formId, incidentDate, form = {}, agencyId } = await this.draftReportService.getCurrentDraft(
      req.user.username,
      bookingId
    )
    return { formId, incidentDate, form, agencyId }
  }

  private async getSubmitRedirectLocation(req: Request, bookingId: number, editMode: true, submitType) {
    if (submitType === SubmitType.SAVE_AND_CHANGE_PRISON) {
      return editMode ? `/report/${bookingId}/edit-change-prison` : `/report/${bookingId}/change-prison`
    }

    if (editMode) {
      return `/report/${bookingId}/check-your-answers`
    }

    const nextPath = nextPaths.incidentDetails(bookingId)

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
    const { form, incidentDate, agencyId: persistedAgencyId } = await this.loadForm(req)

    const token = await this.systemToken(res.locals.user.username)
    const offenderDetail = await this.offenderService.getOffenderDetails(token, bookingId)

    // If report has been created, use persisted agency Id which is robust against offender moving establishments
    const prisonId = persistedAgencyId || offenderDetail.agencyId
    const locations = await this.locationService.getIncidentLocations(token, prisonId)

    const { displayName, offenderNo } = offenderDetail

    const input = firstItem(req.flash('userInput'))

    const prison = await this.locationService.getPrisonById(token, prisonId)

    const data = {
      ...input,
      displayName,
      offenderNo,
      incidentDate: this.getIncidentDate(incidentDate, input && input.incidentDate),
      locations,
      prison,
    }

    renderForm({ req, res, form, data, editMode })
  }

  private submit = editMode => async (req, res: Response) => {
    const { bookingId } = req.params
    const { submitType } = req.body

    const fullValidation = submitType === SubmitType.SAVE_AND_CONTINUE

    const { payloadFields, extractedFields, errors } = processInput({
      validationSpec: fullValidation ? full[formName] : partial[formName],
      input: req.body,
    })

    const { incidentDate }: { incidentDate: ParsedDate } = extractedFields

    const updatedSection = payloadFields

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      req.flash('userInput', { ...payloadFields, incidentDate }) // merge all fields back together!
      return res.redirect(req.originalUrl)
    }

    await this.draftReportService.process(
      res.locals.user,
      parseInt(bookingId, 10),
      formName,
      updatedSection,
      incidentDate ? incidentDate.value : null
    )

    const location = await this.getSubmitRedirectLocation(req, bookingId, editMode, submitType)
    return res.redirect(location)
  }

  public viewIncidentDetailsForm: RequestHandler = this.viewIncidentDetails(false)

  public viewEditIncidentDetailsForm: RequestHandler = this.viewIncidentDetails(true)

  public submitForm: RequestHandler = this.submit(false)

  public submitEditForm: RequestHandler = this.submit(true)

  public cancelEdit: RequestHandler = async (req, res) => {
    const { bookingId } = req.params
    return res.redirect(`/report/${bookingId}/check-your-answers`)
  }
}
