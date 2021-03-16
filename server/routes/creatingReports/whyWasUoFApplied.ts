import type { Request, RequestHandler, Response } from 'express'
import type DraftReportService from '../../services/drafts/draftReportService'
import { UofReasons } from '../../config/types'
import { paths } from '../../config/incident'

const FORM = 'reasonsForUseOfForce'

export default class WhyWasUoFAppliedRoutes {
  constructor(private readonly draftReportService: DraftReportService) {}

  public view() {
    return async (req: Request, res: Response): Promise<void> => {
      const { bookingId } = req.params
      const { reasons } = await this.draftReportService.getSelectedReasonsForUoF(req.user.username, Number(bookingId))

      return res.render('formPages/incident/select-uof-reasons', {
        errors: req.flash('errors'),
        data: { UofReasons, reasons },
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { bookingId } = req.params
      const { reasons } = req.body

      if (!reasons) {
        req.flash('errors', [{ href: '#reasons', text: 'Select the reasons why use of force was applied' }])
        return res.redirect(req.originalUrl)
      }

      await this.draftReportService.process(res.locals.user, Number(bookingId), FORM, { reasons })

      return reasons.length > 1
        ? res.redirect(paths.whatWasPrimaryReasonForUoF(bookingId))
        : res.redirect(paths.useOfForceDetails(bookingId))
    }
  }

  public viewPrimarySelection() {
    return async (req: Request, res: Response): Promise<void> => {
      const { bookingId } = req.params

      const { reasons, primaryReason } = await this.draftReportService.getSelectedReasonsForUoF(
        req.user.username,
        Number(bookingId)
      )
      const selectedReasons = Object.values(UofReasons).filter(({ value }) => reasons.includes(value))

      return res.render('formPages/incident/select-primary-uof-reason', {
        errors: req.flash('errors'),
        data: { reasons, selectedReasons, primaryReason },
      })
    }
  }

  public submitPrimarySelection(): RequestHandler {
    return async (req, res) => {
      const { bookingId } = req.params
      const { reasons, primaryReason } = req.body

      if (!primaryReason) {
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
