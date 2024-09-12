const { stubFor } = require('./wiremock')

module.exports = {
  stubGetDpsLocationMappingUsingNomisLocationId: (nomisLocationId, response) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/nomis-mapping/mapping/locations/nomis/${nomisLocationId}`,
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
