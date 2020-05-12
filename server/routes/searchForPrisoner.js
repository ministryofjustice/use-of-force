const url = require('url')

module.exports = function SearchForPrisonerRoutes({ prisonerSearchService }) {
  const extractSearchForm = ({ prisonNumber, firstName, lastName, agencyId }) => ({
    form: { prisonNumber, firstName, lastName, agencyId },
    openDetails: Boolean(firstName || lastName || agencyId),
  })

  return {
    view: async (req, res) => {
      const { form, openDetails } = extractSearchForm(req.query)
      const results = await await prisonerSearchService.search(form)
      const prisons = await prisonerSearchService.getPrisons()
      return res.render('pages/search-for-prisoner', {
        data: { prisons, results, form: { ...form, openDetails } },
        errors: [],
      })
    },

    submit: async (req, res) => {
      const { prisonNumber, firstName, lastName, agencyId } = req.body
      return res.redirect(
        url.format({
          pathname: '/search-for-prisoner',
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
