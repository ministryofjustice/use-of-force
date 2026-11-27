const { stubFor } = require('./wiremock')

module.exports = {
  stubPrison: prisonId => {
    const descriptions = { LEI: 'Leeds', MDI: 'Moorland' }

    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prison-register/api/agencies/${prisonId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          agencyId: prisonId,
          description: descriptions[prisonId],
          agencyType: 'PRISON',
          active: true,
        },
      },
    })
  },

  stubPrisons: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/prison-register/api/agencies/type/PRISON',
        queryParameters: { activeOnly: { equalTo: 'true' } },
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          { agencyId: 'MDI', description: 'HMP Moorland', agencyType: 'PRISON', active: true },
          { agencyId: 'LEI', description: 'HMP Leeds', agencyType: 'PRISON', active: true },
          { agencyId: 'RSI', description: 'HMP Risley', agencyType: 'PRISON', active: true },
        ],
      },
    })
  },
}
