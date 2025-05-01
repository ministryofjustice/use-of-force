import { Request, RequestHandler, Response } from 'express'
import LocationService from '../../services/locationService'
import DraftReportService from '../../services/drafts/draftReportService'
import { AuthService } from '../../services'

export default class ChangePrisonRoutes {
  constructor(
    private readonly locationService: LocationService,
    private readonly draftReportService: DraftReportService,
    private readonly authService: AuthService
  ) {}

  public viewPrisons: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const token = await this.authService.getSystemClientToken(res.locals.user.username)
    const prisons = await this.locationService.getPrisons(token)
    const errors = req.flash('errors')
    const data = { prisons, errors }
    res.render('formPages/incident/changePrison', data)
  }

  public submit: RequestHandler = async (req, res) => {
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

      const userInput = req.flash('userInputForIncidentDetails')

      // this will create a new report record if it doesn't exist already
      await this.draftReportService.process(
        res.locals.user,
        parseInt(bookingId, 10),
        'incidentDetails',
        {
          plannedUseOfForce: userInput[0]?.plannedUseOfForce,
          authorisedBy: userInput[0]?.authorisedBy,
          witnesses: userInput[0]?.witnesses,
        },
        null
      )

      await this.draftReportService.updateAgencyId(agencyId, username, Number(bookingId))
    }

    return res.redirect(`/report/${bookingId}/incident-details`)
  }
}
