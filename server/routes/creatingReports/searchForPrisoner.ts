import url from 'url'
import { Request, Response } from 'express'
import validateForm from './searchForPrisonerValidation'
import { SearchForm } from '../../data/prisonerSearchClient'
import { PrisonerSearchService } from '../../services'

const extractForm = ({ prisonNumber, firstName, lastName, agencyId }): { form: SearchForm; openDetails: boolean } => ({
  form: { prisonNumber, firstName, lastName, agencyId },
  openDetails: Boolean(firstName || lastName || agencyId),
})

export default class SearchForPrisonerRoutes {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  private renderView = validate => async (req, res): Promise<void> => {
    const { form, openDetails } = extractForm(req.query)
    const error = validate ? validateForm(form) : null
    const results = error || !validate ? [] : await this.prisonerSearchService.search(req.user.username, form)
    const prisons = await this.prisonerSearchService.getPrisons(req.user.username)

    return res.render('pages/search-for-prisoner', {
      data: { prisons, results, form: { ...form, openDetails } },
      errors: error ? [error] : [],
      errorOccurred: Boolean(error),
    })
  }

  view = this.renderView(false)

  showResults = this.renderView(true)

  submit = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber, firstName, lastName, agencyId } = req.body

    return res.redirect(
      url.format({
        pathname: '/search-for-prisoner-results',
        query: {
          ...(prisonNumber && { prisonNumber }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(agencyId && { agencyId }),
        },
      })
    )
  }
}
