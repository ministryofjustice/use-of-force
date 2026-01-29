import { NextFunction, Request, Response } from 'express'
import DraftReportService from '../services/drafts/draftReportService'
import config from '../config'
/**
 * Middleware to check if the incident date is within the permitted submission window (currently 13 weeks).
 * The middleware is selectively applied to create report routes.
 * It will prevent users from saving any more changes or submitting a report that occurred too long ago.
 */
export default (draftReportService: DraftReportService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (config.featureFlagViewOnlyModeEnabled) {
      const { bookingId } = req.params

      const { incidentDate } = await draftReportService.getCurrentDraft(req.user.username, Number(bookingId))
      let isChangeAllowed = true

      if (incidentDate) {
        isChangeAllowed = draftReportService.isIncidentDateWithinSubmissionWindow(new Date(incidentDate))
      }

      if (!isChangeAllowed) {
        res.locals.renderInProgressReportAsViewOnly = true
      }
    }
    next()
  }
