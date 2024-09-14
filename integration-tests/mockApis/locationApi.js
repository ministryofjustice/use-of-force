const { stubFor } = require('./wiremock')

module.exports = {
  stubGetLocation: incidentLocationId => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/location-api/locations/${incidentLocationId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },

        jsonBody: {
          pathHierarchy: 'ASSO A WING',
          localName: 'ASSO A Wing',
        },
      },
    })
  },

  stubLocationNotFound: incidentLocationId => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/location-api/locations/${incidentLocationId}`,
      },
      response: {
        status: 404,
      },
    })
  },

  stubGetLocations: (prisonId, usageType = 'OCCURRENCE') => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/location-api/locations/prison/${prisonId}/non-residential-usage-type/${usageType}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            id: '00000000-1111-2222-3333-444444444440',
            prisonId,
            localName: 'Residential',
            pathHierarchy: 'RES',
            key: `${prisonId}-RES`,
          },

          {
            id: '00000000-1111-2222-3333-444444444441',
            prisonId,
            localName: 'Residential',
            pathHierarchy: 'RES',
            key: `${prisonId}-RES`,
          },
          {
            id: '00000000-1111-2222-3333-444444444442',
            prisonId,
            localName: '5-a-side Com',
            pathHierarchy: 'GYM-5-A-SIDE COM',
            key: `${prisonId}-GYM-5-A-SIDE COM`,
          },
          {
            id: '00000000-1111-2222-3333-444444444443',
            localName: 'Adj',
            prisonId,
            pathHierarchy: 'RES-MCASU-MCASU',
            key: `${prisonId}-RES-MCASU-MCASU`,
          },
          {
            id: '00000000-1111-2222-3333-444444444444',
            prisonId,
            localName: 'Asso A Wing',
            key: `${prisonId}-RES-HB6-HB6ASSO A`,
            pathHierarchy: 'RES-HB6-HB6ASSO A',
          },
          {
            id: '00000000-1111-2222-3333-444444444445',
            prisonId,
            localName: 'Asso B Wing',
            pathHierarchy: 'RES-HB6-HB6ASSO B',
            key: `${prisonId}-RES-HB6-HB6ASSO B`,
          },
        ],
      },
    })
  },
}
