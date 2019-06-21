require('dotenv').config()

const production = process.env.NODE_ENV === 'production'

function get(name, fallback, options = {}) {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

module.exports = {
  sessionSecret: get('SESSION_SECRET', 'app-insecure-default-session', { requireInProduction: true }),
  db: {
    username: get('DB_USER', 'use-of-force'),
    password: get('DB_PASS', 'use-of-force'),
    server: get('DB_SERVER', 'localhost'),
    database: get('DB_NAME', 'use-of-force'),
    sslEnabled: get('DB_SSL_ENABLED', 'false'),
  },
  apis: {
    oauth2: {
      url: get('NOMIS_AUTH_URL', 'http://localhost:9090/auth', true),
      externalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth'), true),
      timeout: {
        response: 30000,
        deadline: 35000,
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
      apiClientId: get('API_CLIENT_ID', 'use-of-force-client', true),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret'),
    },
    elite2: {
      url: get('ELITE2API_ENDPOINT_URL', 'http://localhost:8080/', true),
      timeout: {
        response: get('ELITE2API_ENDPOINT_TIMEOUT_RESPONSE', 30000, true),
        deadline: get('ELITE2API_ENDPOINT_TIMEOUT_DEADLINE', 35000, true),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
  },
  domain: `${get('INGRESS_URL', 'http://localhost:3000', true)}`,
}
