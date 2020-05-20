const { stubFor } = require('./wiremock')

module.exports = {
  stubUser: () => {
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
          firstName: 'JAMES',
          lastName: 'STUART',
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
  stubOffenderDetails: bookingId => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/api/bookings/${bookingId}\\?basicInfo=false`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          offenderNo: 'A1234AC',
          firstName: 'NORMAN',
          lastName: 'SMITH',
          agencyId: 'MDI',
          dateOfBirth: '2000-12-26',
        },
      },
    })
  },
  stubOffenders: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/api/bookings/offenders\\?activeOnly=false`,
        bodyPatterns: [{ equalToJson: ['A1234AC'] }],
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            offenderNo: 'A1234AC',
            firstName: 'NORMAN',
            lastName: 'SMITH',
            agencyId: 'MDI',
            dateOfBirth: '2000-12-26',
          },
        ],
      },
    })
  },
  stubLocation: locationId => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/api/locations/${locationId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          description: 'ASSO A Wing',
        },
      },
    })
  },
  stubPrison: prisonId => {
    const getPrisonDescription = () => {
      const prisons = [
        { id: 'LEI', description: 'Leeds' },
        { id: 'MDI', description: 'Moorland' },
      ]
      return prisons.find(prison => prison.id === prisonId).description
    }

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
          description: getPrisonDescription(),
          agencyType: 'INST',
          active: true,
        },
      },
    })
  },
  stubLocations: agencyId => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/api/agencies/${agencyId}/locations\\?eventType=OCCUR`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            locationId: 1,
            locationType: 'RESI',
            description: 'RES',
            agencyId,
            currentOccupancy: 0,
            locationPrefix: `${agencyId}-RES`,
            userDescription: 'Residential',
          },
          {
            locationId: 27233,
            locationType: 'SPOR',
            description: 'GYM-5-A-SIDE COM',
            agencyId,
            parentLocationId: 1,
            currentOccupancy: 0,
            locationPrefix: `${agencyId}-GYM-5-A-SIDE COM`,
            userDescription: '5-a-side Com',
          },
          {
            locationId: 27187,
            locationType: 'ADJU',
            description: 'RES-MCASU-MCASU',
            agencyId,
            parentLocationId: 1,
            currentOccupancy: 0,
            locationPrefix: `${agencyId}-RES-MCASU-MCASU`,
            userDescription: 'Adj',
          },
          {
            locationId: 357591,
            locationType: 'ASSO',
            description: 'RES-HB6-HB6ASSO A',
            agencyId,
            parentLocationId: 1,
            currentOccupancy: 0,
            locationPrefix: `${agencyId}-RES-HB6-HB6ASSO A`,
            userDescription: 'Asso A Wing',
          },
          {
            locationId: 357592,
            locationType: 'ASSO',
            description: 'RES-HB6-HB6ASSO B',
            agencyId,
            parentLocationId: 1,
            currentOccupancy: 0,
            locationPrefix: `${agencyId}-RES-HB6-HB6ASSO B`,
            userDescription: 'Asso B Wing',
          },
        ],
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
