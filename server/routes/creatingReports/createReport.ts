import { Request, Response } from 'express'
import { isNilOrEmpty, firstItem } from '../../utils/utils'
import * as types from '../../config/types'
import { processInput } from '../../services/validation'
import { nextPaths, paths, full, partial } from '../../config/incident'
import type DraftReportService from '../../services/drafts/draftReportService'
import { isReportComplete } from '../../services/drafts/reportStatusChecker'
import OffenderService from '../../services/offenderService'

enum SubmitType {
  SAVE_AND_CONTINUE = 'save-and-continue',
  SAVE_AND_RETURN = 'save-and-return',
}

export default class CreateReport {
  constructor(
    private readonly draftReportService: DraftReportService,
    private readonly offenderService: OffenderService
  ) {}

  private async loadForm(req) {
    const { bookingId } = req.params
    const { form = {} } = await this.draftReportService.getCurrentDraft(req.user.username, bookingId)
    return { form, isComplete: isReportComplete(form) }
  }

  private async getSubmitRedirectLocation(req: Request, formName: string, bookingId: number, submitType: SubmitType) {
    const { username } = req.user

    if (await this.draftReportService.isDraftComplete(username, bookingId)) {
      return paths.checkYourAnswers(bookingId)
    }

    const nextPath = nextPaths[formName](bookingId)

    return submitType === SubmitType.SAVE_AND_CONTINUE ? nextPath : paths.reportUseOfForce(bookingId)
  }

  public view(formName: string) {
    return async (req, res: Response): Promise<void> => {
      const { bookingId } = req.params
      const bookingIdNumber = Number(bookingId)
      const offenderDetail = await this.offenderService.getOffenderDetails(bookingIdNumber, res.locals.user.username)
      const { form, isComplete } = await this.loadForm(req)
      const pageData = firstItem(req.flash('userInput')) || form[formName]
      const errors = req.flash('errors')
      const { incidentDate } = await this.draftReportService.getCurrentDraft(req.user.username, Number(bookingId))
      let submissionAllowed = true

      if (incidentDate) {
        submissionAllowed = this.draftReportService.isIncidentDateWithinSubmissionWindow(new Date(incidentDate))
      }
      res.render(`formPages/incident/${formName}`, {
        data: { offenderDetail, bookingId: bookingIdNumber, ...pageData, types },
        formName,
        errors,
        editMode: isComplete,
        preventReportSubmission: !submissionAllowed,
      })
    }
  }

  public submit(formName: string) {
    return async (req, res: Response): Promise<void> => {
      const { bookingId } = req.params
      const { submitType } = req.body

      const fullValidation = submitType === SubmitType.SAVE_AND_CONTINUE

      const { payloadFields: updatedSection, errors } = processInput({
        validationSpec: fullValidation ? full[formName] : partial[formName],
        input: req.body,
      })

      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        req.flash('userInput', updatedSection)
        return res.redirect(req.originalUrl)
      }

      await this.draftReportService.process(res.locals.user, Number(bookingId), formName, updatedSection)

      const location = await this.getSubmitRedirectLocation(req, formName, Number(bookingId), submitType)
      return res.redirect(location)
    }
  }
}
