import moment from 'moment'
import { Request, Response } from 'express'
import { isNilOrEmpty, firstItem } from '../../utils/utils'
import * as types from '../../config/types'
import { processInput } from '../../services/validation'
import { nextPaths, full, partial } from '../../config/incident'
import type OffenderService from '../../services/offenderService'
import type LocationService from '../../services/locationService'
import type DraftReportService from '../../services/drafts/draftReportService'
import type { ParsedDate } from '../../utils/dateSanitiser'
import type { SystemToken } from '../../types/uof'
import { isReportComplete } from '../../services/drafts/reportStatusChecker'

const formName = 'incidentDetails'

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
    const {
      id: formId,
      incidentDate,
      form = {},
      agencyId,
    } = await this.draftReportService.getCurrentDraft(req.user.username, bookingId)
    return { formId, incidentDate, form, persistedAgencyId: agencyId, isComplete: isReportComplete(form) }
  }

  private async getSubmitRedirectLocation(req: Request, bookingId: number, submitType) {
    if (submitType === SubmitType.SAVE_AND_CHANGE_PRISON) {
      return `/report/${bookingId}/change-prison`
    }

    if (await this.draftReportService.isDraftComplete(req.user.username, bookingId)) {
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

  public view = async (req, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const { form, incidentDate, persistedAgencyId, isComplete } = await this.loadForm(req)

    const token = await this.systemToken(res.locals.user.username)
    const offenderDetail = await this.offenderService.getOffenderDetails(token, bookingId)

    // If report has been created, use persisted agency Id which is robust against offender moving establishments
    const prisonId = persistedAgencyId || offenderDetail.agencyId
    const locations = await this.locationService.getIncidentLocations(token, prisonId)

    const { displayName, offenderNo } = offenderDetail

    const input = firstItem(req.flash('userInput'))
    const pageData = input || form[formName]

    const prison = await this.locationService.getPrisonById(token, prisonId)

    const data = {
      bookingId,
      ...pageData,
      displayName,
      offenderNo,
      incidentDate: this.getIncidentDate(incidentDate, input?.incidentDate),
      locations,
      prison,
      types,
    }

    return res.render(`formPages/incident/${formName}`, {
      data,
      formName,
      errors: req.flash('errors'),
      editMode: isComplete,
    })
  }

  public submit = async (req, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const { submitType } = req.body
    const token = await this.systemToken(res.locals.user.username)

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
      incidentDate?.value || null
    )

    if (incidentDate && submitType !== SubmitType.SAVE_AND_CHANGE_PRISON) {
      const duplicates = await this.draftReportService.getPotentialDuplicates(
        parseInt(bookingId, 10),
        moment(incidentDate.value),
        token
      )

      if (duplicates.length) {
        return res.redirect(`/report/${bookingId}/report-may-already-exist?submission=${submitType}`)
      }
    }
    const location = await this.getSubmitRedirectLocation(req, bookingId, submitType)
    return res.redirect(location)
  }
}
