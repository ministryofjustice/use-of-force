const jwt = require('jsonwebtoken')
const { stubFor, getRequests } = require('./wiremock')

const createToken = isReviewer => {
  const payload = {
    user_name: 'ITAG_USER',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities: [
      ...(isReviewer ? ['ROLE_USE_OF_FORCE_REVIEWER'] : []),
      'ROLE_MAINTAIN_ACCESS_ROLES_ADMIN',
      'ROLE_CATEGORISATION_SECURITY',
      'ROLE_GLOBAL_SEARCH',
      'ROLE_CREATE_CATEGORISATION',
      'ROLE_OMIC_ADMIN',
      'ROLE_APPROVE_CATEGORISATION',
    ],
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'use-of-force-client',
  }

  const token = jwt.sign(payload, 'secret', { expiresIn: '1h' })
  return token
}

const getLoginUrl = () =>
  getRequests().then(data => {
    const { requests } = data.body
    const stateParam = requests[0].request.queryParams.state
    const stateValue = stateParam ? stateParam.values[0] : requests[1].request.queryParams.state.values[0]
    return `/login/callback?code=codexxxx&state=${stateValue}`
  })

const favicon = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/favicon.ico',
    },
    response: {
      status: 200,
    },
  })

const redirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/oauth/authorize\\?response_type=code&redirect_uri=.+?&state=.+?&client_id=use-of-force-client',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        Location: 'http://localhost:3007/login/callback?code=codexxxx&state=stateyyyy',
      },
      body: '<html><body>Login page<h1>Sign in</h1></body></html>',
    },
  })

const logout = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/logout.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body>Login page<h1>Sign in</h1></body></html>',
    },
  })

const token = ({ isReviewer = false }) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Location: 'http://localhost:3007/login/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: createToken(isReviewer),
        token_type: 'bearer',
        refresh_token: 'refresh',
        user_name: 'Test User',
        expires_in: 600,
        scope: 'read write',
        internalUser: true,
      },
    },
  })

const stubUser = username =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/auth/api/user/${encodeURI(username)}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        user_name: username,
        staffId: 231232,
        username,
        active: true,
        name: `${username} name`,
        authSource: 'nomis',
        activeCaseLoadId: 'MDI',
      },
    },
  })

const stubEmail = username =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/auth/api/user/${encodeURI(username)}/email`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        username,
        email: `${username}@gov.uk`,
      },
    },
  })

module.exports = {
  getLoginUrl,
  stubLogin: options => Promise.all([favicon(), redirect(), logout(), token(options)]),
  stubUserDetailsRetrieval: username => Promise.all([stubUser(username), stubEmail(username)]),
}
