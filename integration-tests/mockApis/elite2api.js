const { stubFor } = require('./wiremock')

module.exports = {
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
        },
      },
    })
  },
}
