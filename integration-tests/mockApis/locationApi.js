const { stubFor } = require('./wiremock')

module.exports = {
  stubGetLocation: (incidentLocationId, response) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/locations/${incidentLocationId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: response,
      },
    })
  },
  stubGetLocations: (prisonId, usageType, response) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/locations/prison/${prisonId}/non-residential-usage-type/${usageType}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: response,
      },
    })
  },
}
