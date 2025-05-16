const { stubFor } = require('./wiremock')

module.exports = {
  stubUser: ({ firstName, lastName } = {}) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/users/me',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          firstName,
          lastName,
          activeCaseLoadId: 'MDI',
        },
      },
    })
  },
  stubUserCaseloads: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/users/me/caseLoads',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            caseLoadId: 'MDI',
            description: 'Moorland',
          },
        ],
      },
    })
  },
  stubOffenderDetails: details => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/api/bookings/${details.bookingId}\\?basicInfo=false`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: details,
      },
    })
  },
  stubOffenders: offenders => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/api/bookings/offenders\\?activeOnly=false`,
        bodyPatterns: [{ equalToJson: offenders.map(o => o.offenderNo), ignoreArrayOrder: true }],
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: offenders,
      },
    })
  },

  stubPrison: prisonId => {
    const descriptions = { LEI: 'Leeds', MDI: 'Moorland' }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/api/agencies/${prisonId}\\?activeOnly=false`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          agencyId: prisonId,
          description: descriptions[prisonId],
          agencyType: 'INST',
          active: true,
        },
      },
    })
  },

  stubPrisons: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/api/agencies/type/INST\\?active=true`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            description: 'HMP Moorland',
            agencyId: 'MDI',
          },
          {
            description: 'HMP Leeds',
            agencyId: 'LEI',
          },
          {
            description: 'HMP Risley',
            agencyId: 'RSI',
          },
        ],
      },
    })
  },
}
