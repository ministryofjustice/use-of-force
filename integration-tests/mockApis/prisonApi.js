const { stubFor } = require('./wiremock')

module.exports = {
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
  stubOffenderImage: bookingId => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/api/bookings/${bookingId}/image/data`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      },
    })
  },
}
