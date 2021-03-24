import type { Request, RequestHandler, Response } from 'express'
import type DraftReportService from '../../services/drafts/draftReportService'
import { UofReasons } from '../../config/types'
import { paths } from '../../config/incident'

const FORM = 'reasonsForUseOfForce'

enum SubmitType {
  SAVE_AND_CONTINUE = 'save-and-continue',
  SAVE_AND_RETURN = 'save-and-return',
}

export default class WhyWasUoFAppliedRoutes {
  constructor(private readonly draftReportService: DraftReportService) {}

  public view() {
    return async (req: Request, res: Response): Promise<void> => {
      const { bookingId } = req.params
      const { isComplete, reasons } = await this.draftReportService.getUoFReasonState(
        req.user.username,
        Number(bookingId)
      )

      const selectedReasons = req.flash('clearingOutReasons')?.length ? [] : reasons

      return res.render('formPages/incident/select-uof-reasons', {
        errors: req.flash('errors'),
        data: { bookingId, UofReasons, reasons: selectedReasons },
        editMode: isComplete,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { bookingId } = req.params
      const { reasons, submitType } = req.body

      if (!reasons) {
        req.flash('clearingOutReasons', true)
        req.flash('errors', [{ href: '#reasons', text: 'Select the reasons why use of force was applied' }])
        return res.redirect(req.originalUrl)
      }

      if (submitType === SubmitType.SAVE_AND_RETURN) {
        await this.draftReportService.process(res.locals.user, Number(bookingId), FORM, { reasons })
        return res.redirect(paths.reportUseOfForce(bookingId))
      }

      if (reasons.length === 1) {
        await this.draftReportService.process(res.locals.user, Number(bookingId), FORM, { reasons })
        return res.redirect(paths.useOfForceDetails(bookingId))
      }

      req.flash('reasons', reasons)
      return res.redirect(paths.whatWasPrimaryReasonForUoF(bookingId))
    }
  }

  public viewPrimarySelection() {
    return async (req: Request, res: Response): Promise<void> => {
      const { bookingId } = req.params

      const { primaryReason, reasons } = await this.draftReportService.getUoFReasonState(
        req.user.username,
        Number(bookingId)
      )

      const updatedReasons = req.flash('reasons')
      const reasonsToUse = updatedReasons.length ? updatedReasons : reasons

      if (reasonsToUse.length === 1) {
        return res.redirect(paths.whyWasUofApplied(bookingId))
      }

      const selectedReasons = Object.values(UofReasons).filter(({ value }) => reasonsToUse.includes(value))

      return res.render('formPages/incident/select-primary-uof-reason', {
        errors: req.flash('errors'),
        data: { bookingId, reasons: selectedReasons, primaryReason },
      })
    }
  }

  public submitPrimarySelection(): RequestHandler {
    return async (req, res) => {
      const { bookingId } = req.params
      const { reasons, primaryReason } = req.body

      if (!primaryReason) {
        req.flash('reasons', reasons)
        req.flash('errors', [
          { href: '#primaryReason', text: 'Select the primary reason why use of force was applied' },
        ])
        return res.redirect(req.originalUrl)
      }

      await this.draftReportService.process(res.locals.user, Number(bookingId), FORM, { reasons, primaryReason })

      return res.redirect(paths.useOfForceDetails(bookingId))
    }
  }
}
