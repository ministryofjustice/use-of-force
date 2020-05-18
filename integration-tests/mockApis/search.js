const { stubFor } = require('./wiremock')

module.exports = {
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
