const { stubFor } = require('./wiremock')

module.exports = {
  stubCurrentUser: ({ activeCaseLoadId = 'MDI' } = {}) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/users/me',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          username: 'ITAG_USER',
          active: true,
          authSource: 'nomis',
          activeCaseLoadId,
        },
      },
    })
  },

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

  stubGetUser: (usernameOrInput, response = {}) => {
    const { username, response: body = response } =
      typeof usernameOrInput === 'string' ? { username: usernameOrInput, response } : usernameOrInput

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/users/${username}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          username,
          active: true,
          name: `${username} name`,
          authSource: 'nomis',
          userId: '231232',
          ...body,
        },
      },
    })
  },
}
