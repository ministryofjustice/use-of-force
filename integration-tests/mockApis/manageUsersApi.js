const { stubFor } = require('./wiremock')

module.exports = {
  stubStaffMemberSearch: ({ searchText, response }) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prisonusers/search\\?nameFilter=${searchText}&page=0`,
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

  stubGetUser: (user, response = {}) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/users/${user}`,
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
