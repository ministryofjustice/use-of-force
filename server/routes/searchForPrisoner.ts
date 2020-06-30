import url from 'url'
import validateForm from './searchForPrisonerValidation'
import { SearchForm } from '../data/prisonerSearchClient'

export default function SearchForPrisonerRoutes({ prisonerSearchService }): any {
  const extractForm = ({
    prisonNumber,
    firstName,
    lastName,
    agencyId,
  }): { form: SearchForm; openDetails: boolean } => ({
    form: { prisonNumber, firstName, lastName, agencyId },
    openDetails: Boolean(firstName || lastName || agencyId),
  })

  const renderView = validate => async (req, res): Promise<void> => {
    const { form, openDetails } = extractForm(req.query)
    const error = validate ? validateForm(form) : null
    const results = error || !validate ? [] : await prisonerSearchService.search(req.user.username, form)
    const prisons = await prisonerSearchService.getPrisons(req.user.username)

    return res.render('pages/search-for-prisoner', {
      data: { prisons, results, form: { ...form, openDetails } },
      errors: error ? [error] : [],
      errorOccurred: Boolean(error),
    })
  }

  return {
    view: renderView(false),

    showResults: renderView(true),

    submit: async (req, res): Promise<void> => {
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
    },
  }
}
