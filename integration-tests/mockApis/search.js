const { stubFor } = require('./wiremock')

module.exports = {
  // Takes offenders in the shape the specs use ({ offenderNo, firstName, lastName }) and answers the
  // Prisoner Search bulk name lookup with them
  stubPrisonerNames: offenders => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/search/prisoner-search/prisoner-numbers',
        bodyPatterns: [{ equalToJson: { prisonerNumbers: offenders.map(o => o.offenderNo) }, ignoreArrayOrder: true }],
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: offenders.map(({ offenderNo, firstName, lastName }) => ({
          prisonerNumber: offenderNo,
          firstName,
          lastName,
        })),
      },
    })
  },

  stubSearch: ({ query, results }) => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/search/prisoner-search/match',
        bodyPatterns: [query],
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: results,
      },
    })
  },
}
