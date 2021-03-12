import { Request, RequestHandler, Response } from 'express'
import LocationService from '../../services/locationService'
import DraftReportService from '../../services/drafts/draftReportService'
import { SystemToken } from '../../types/uof'

export default class ChangePrisonRoutes {
  constructor(
    private readonly locationService: LocationService,
    private readonly draftReportService: DraftReportService,
    private readonly systemToken: SystemToken
  ) {}

  public viewPrisons(): RequestHandler {
    return async (req: Request, res: Response): Promise<void> => {
      const token = await this.systemToken(res.locals.user.username)
      const prisons = await this.locationService.getPrisons(token)
      const errors = req.flash('errors')
      const data = { prisons, errors }
      res.render('formPages/incident/changePrison', data)
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { bookingId } = req.params
      const { agencyId, submit } = req.body
      const { username } = res.locals.user
      const saveAndContinue = submit === 'save-and-continue'

      if (saveAndContinue) {
        const error = [
          {
            text: 'What prison did the use of force take place in?',
            href: '#agencyId',
          },
        ]

        if (!agencyId) {
          req.flash('errors', error)
          return res.redirect(req.originalUrl)
        }

        await this.draftReportService.updateAgencyId(agencyId, username, Number(bookingId))
      }

      return res.redirect(`/report/${bookingId}/incident-details`)
    }
  }
}
