const url = require('url')

module.exports = function SearchForPrisonerRoutes() {
  const extractSearchForm = ({ prisonNumber, firstName, lastName, agencyId }) => ({
    prisonNumber,
    firstName,
    lastName,
    agencyId,
    openDetails: Boolean(firstName || lastName || agencyId),
  })

  const getResults = ({ openDetails, prisonNumber }) =>
    openDetails || prisonNumber
      ? [
          { name: 'Norman Bates', prisonNumber: 'A1234AC', prison: 'HMP Leeds', bookingId: -3 },
          { name: 'Arthur Anderson', prisonNumber: 'A1234AA', prison: 'HMP Hull', bookingId: -1 },
          { name: 'Gillian Anderson', prisonNumber: 'A1234AB', prison: 'HMP Leeds', bookingId: -2 },
        ]
      : []

  return {
    view: async (req, res) => {
      const prisons = []
      const form = extractSearchForm(req.query)
      const results = getResults(form)
      return res.render('pages/search-for-prisoner', { data: { prisons, results, form }, errors: [] })
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
