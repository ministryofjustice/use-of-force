const { stubFor } = require('./wiremock')

module.exports = {
  stubGetDpsLocationMappingUsingNomisLocationId: nomisLocationId => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/nomis-mapping/api/locations/nomis/${nomisLocationId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          dpsLocationId: '00000000-1111-2222-3333-444444444444',
          nomisLocationId,
        },
      },
    })
  },
}
