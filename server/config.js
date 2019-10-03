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

const requiredInProduction = { requireInProduction: true }

module.exports = {
  sessionSecret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
  db: {
    username: get('DB_USER', 'use-of-force'),
    password: get('DB_PASS', 'use-of-force'),
    server: get('DB_SERVER', 'localhost'),
    database: get('DB_NAME', 'use-of-force'),
    port: get('DB_PORT', 5432),
    sslEnabled: get('DB_SSL_ENABLED', 'false'),
  },
  email: {
    notifyKey: get('NOTIFY_API_KEY', 'invalid-token', requiredInProduction),
    enabled: get('NOTIFY_ENABLED', true),
    templates: {
      involvedStaff: {
        REQUEST: get('TEMPLATE_INVOLVED_REQUEST', '6c231fa9-316d-40c7-8cc0-efee73845009'),
        REMINDER: get('TEMPLATE_INVOLVED_REMINDER', 'a8c8f449-b605-4a7c-9324-cd0840cdb758'),
        OVERDUE: get('TEMPLATE_INVOLVED_OVERDUE', '9cd692a0-68c6-4e33-b38a-595e84422841'),
      },
      reporter: {
        REMINDER: get('TEMPLATE_REPORTER_REMINDER', 'c4611599-929f-4f27-94f7-af1ee85fef6d'),
        OVERDUE: get('TEMPLATE_REPORTER_OVERDUE', '1cd6cd3f-7d45-4487-b029-c2a1270e6be8'),
      },
    },
  },
  apis: {
    oauth2: {
      url: get('NOMIS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: get('AUTH_ENDPOINT_TIMEOUT_RESPONSE', 10000, requiredInProduction),
        deadline: get('AUTH_ENDPOINT_TIMEOUT_DEADLINE', 10000, requiredInProduction),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
      apiClientId: get('API_CLIENT_ID', 'use-of-force-client', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret'),
    },
    elite2: {
      url: get('ELITE2API_ENDPOINT_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('ELITE2API_ENDPOINT_TIMEOUT_RESPONSE', 10000, requiredInProduction),
        deadline: get('ELITE2API_ENDPOINT_TIMEOUT_DEADLINE', 10000, requiredInProduction),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
  },
  domain: `${get('INGRESS_URL', 'http://localhost:3000', requiredInProduction)}`,
  links: {
    emailUrl: get('EMAIL_LOCATION_URL', '/', requiredInProduction),
    exitUrl: get('EXIT_LOCATION_URL', '/', requiredInProduction),
  },
  https: production,
}
