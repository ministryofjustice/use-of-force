const jwt = require('jsonwebtoken')
const { stubFor, getRequests } = require('./wiremock')

const createToken = (isReviewer, isCoordinator) => {
  const payload = {
    user_name: 'ITAG_USER',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities: [
      ...(isReviewer ? ['ROLE_USE_OF_FORCE_REVIEWER'] : []),
      ...(isCoordinator ? ['ROLE_USE_OF_FORCE_COORDINATOR'] : []),
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

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

const createClientCredsToken = () => {
  const payload = {
    access_token: 'token',
    token_type: 'bearer',
    expires_in: 1199,
    scope: 'read',
    sub: 'use-of-force-system',
    auth_source: 'none',
    iss: 'https://sign-in-dev.hmpps.service.justice.gov.uk/auth/issuer',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
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

const token = ({ userName = 'TEST_USER', isReviewer = false, isCoordinator = false }) =>
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
        access_token: createToken(isReviewer, isCoordinator),
        token_type: 'bearer',
        refresh_token: 'refresh',
        user_name: userName,
        expires_in: 600,
        scope: 'read write',
        internalUser: true,
      },
    },
  })

const stubClientCredentialsToken = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        access_token: createClientCredsToken(),
        token_type: 'bearer',
        refresh_token: 'refresh',
        expires_in: 600,
        scope: 'read write',
        internalUser: true,
      },
    },
  })

const stubVerifyToken = (active = true) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/token-verification-api/token/verify',
    },
    response: {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        active,
      },
    },
  })

const stubUser = username =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/users/${encodeURI(username)}`,
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

const stubFindUser = (firstName, lastName, results) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prisonusers\\?firstName=${encodeURI(firstName)}&lastName=${encodeURI(lastName)}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: results || [
        {
          username: `${firstName.toUpperCase()}_${lastName.toUpperCase()}`,
          verified: true,
          email: `${firstName}@gov.uk`,
          name: `${firstName} ${lastName}`,
          staffId: firstName.length,
        },
      ],
    },
  })

const stubEmail = username =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/users/${encodeURI(username)}/email`,
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

const stubUnverifiedEmail = username =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/users/${encodeURI(username)}/email`,
    },
    response: {
      status: 204,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {},
    },
  })

module.exports = {
  getLoginUrl,
  stubLogin: options => Promise.all([favicon(), redirect(), logout(), token(options), stubVerifyToken()]),
  stubUserDetailsRetrieval: usernames =>
    Promise.all(usernames.flatMap(username => [stubUser(username), stubEmail(username)])),
  stubFindUsers: ({ firstName, lastName, results }) => stubFindUser(firstName, lastName, results),
  stubUnverifiedUserDetailsRetrieval: username => Promise.all([stubUser(username), stubUnverifiedEmail(username)]),
  stubVerifyToken,
  stubClientCredentialsToken,
}
