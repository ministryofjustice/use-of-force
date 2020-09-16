import { RequestHandler } from 'express'
import { isNilOrEmpty, firstItem } from '../utils/utils'
import types from '../config/types'
import { processInput } from '../services/validation'
import { nextPaths, full, partial } from '../config/incident'
import type DraftReportService from '../services/report/draftReportService'

const SubmitType = {
  SAVE_AND_CONTINUE: 'save-and-continue',
  SAVE_AND_RETURN: 'save-and-return',
}

export default class CreateReport {
  constructor(private readonly draftReportService: DraftReportService) {}

  private async loadForm(req) {
    const { bookingId } = req.params
    const { id: formId, incidentDate, form = {}, agencyId } = await this.draftReportService.getCurrentDraft(
      req.user.username,
      bookingId
    )
    return { formId, incidentDate, form, agencyId }
  }

  private async getSubmitRedirectLocation(req, form, bookingId, editMode, submitType) {
    const { username } = req.user

    if (editMode) {
      return `/report/${bookingId}/check-your-answers`
    }

    if (form === 'evidence' && !(await this.draftReportService.isDraftComplete(username, bookingId))) {
      return `/report/${bookingId}/report-use-of-force`
    }

    const nextPath = nextPaths[form](bookingId)

    return submitType === SubmitType.SAVE_AND_CONTINUE ? nextPath : `/report/${bookingId}/report-use-of-force`
  }

  private view(formName: string, editMode: boolean) {
    return async (req, res) => {
      const { bookingId } = req.params

      const { form } = await this.loadForm(req)
      const pageData = firstItem(req.flash('userInput')) || form[formName]
      const errors = req.flash('errors')
      res.render(`formPages/incident/${formName}`, {
        data: { bookingId, ...pageData, types },
        formName,
        errors,
        editMode,
      })
    }
  }

  private submit(formName: string, editMode: boolean) {
    return async (req, res) => {
      const { bookingId } = req.params
      const { submitType } = req.body

      const fullValidation = submitType === SubmitType.SAVE_AND_CONTINUE

      const { payloadFields, errors } = processInput({
        validationSpec: fullValidation ? full[formName] : partial[formName],
        input: req.body,
      })

      const updatedSection = { ...payloadFields }

      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        req.flash('userInput', updatedSection)
        return res.redirect(req.originalUrl)
      }

      await this.draftReportService.process(res.locals.user, parseInt(bookingId, 10), formName, updatedSection)

      const location = await this.getSubmitRedirectLocation(req, formName, bookingId, editMode, submitType)
      return res.redirect(location)
    }
  }

  public viewForm = (formName: string): RequestHandler => this.view(formName, false)

  public viewEditForm = (formName: string): RequestHandler => this.view(formName, true)

  public submitForm = (formName: string): RequestHandler => this.submit(formName, false)

  public submitEditForm = (formName: string): RequestHandler => this.submit(formName, true)

  public cancelEdit: RequestHandler = async (req, res) => {
    const { bookingId } = req.params
    return res.redirect(`/report/${bookingId}/check-your-answers`)
  }
}
