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
  db: {
    username: get('DB_USER', 'use-of-force'),
    password: get('DB_PASS', 'use-of-force'),
    server: get('DB_SERVER', 'localhost'),
    database: get('DB_NAME', 'use-of-force'),
    port: get('DB_PORT', 5432),
    sslEnabled: get('DB_SSL_ENABLED', 'false'),
  },
  redis: {
    host: get('REDIS_HOST', 'localhost'),
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: get('WEB_SESSION_TIMEOUT_IN_MINUTES', '120', true),
  },
  email: {
    notifyKey: get('NOTIFY_API_KEY', 'invalid-token', requiredInProduction),
    enabled: get('NOTIFY_ENABLED', true),
    templates: {
      involvedStaff: {
        REQUEST: 'a58349d2-8a5f-4a22-8cb3-6a1410201a01',
        REMINDER: 'f561f2bc-9a64-4af2-a34c-ebee08c7503b',
        OVERDUE: 'da6a4684-ec87-4ead-8fcd-ec3a126c4926',
        REMOVED: 'fc24f4e4-a927-492b-9bb4-dfe4f9e6c383',
      },

      reporter: {
        REMINDER: get('TEMPLATE_REPORTER_REMINDER', 'c4611599-929f-4f27-94f7-af1ee85fef6d'),
        OVERDUE: get('TEMPLATE_REPORTER_OVERDUE', '1cd6cd3f-7d45-4487-b029-c2a1270e6be8'),
      },
    },
    urlSigningSecret: get('URL_SIGNING_SECRET', 'someUrlSigningSecret', requiredInProduction),
  },
  apis: {
    oauth2: {
      url: get('NOMIS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('NOMIS_AUTH_EXTERNAL_URL', get('NOMIS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: get('AUTH_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('AUTH_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
      apiClientId: get('API_CLIENT_ID', 'use-of-force-client', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', get('API_CLIENT_ID', 'use-of-force-system'), requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', get('API_CLIENT_SECRET', 'clientsecret'), requiredInProduction),
    },
    prison: {
      url: get('PRISON_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('PRISON_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('PRISON_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    prisonerSearch: {
      url: get('PRISONER_SEARCH_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('PRISONER_SEARCH_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
    },
    tokenVerification: {
      url: get('TOKENVERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: get('TOKENVERIFICATION_TIMEOUT_RESPONSE', 10000),
        deadline: get('TOKENVERIFICATION_TIMEOUT_DEADLINE', 10000),
      },
      agent: {
        maxSockets: 100,
        maxFreeSockets: 10,
        freeSocketTimeout: 30000,
      },
      enabled: process.env.TOKENVERIFICATION_API_ENABLED === 'true',
    },
  },
  domain: `${get('INGRESS_URL', 'http://localhost:3000', requiredInProduction)}`,
  links: {
    emailUrl: get('EMAIL_LOCATION_URL', 'http://localhost:3000', requiredInProduction),
    exitUrl: get('EXIT_LOCATION_URL', '/', requiredInProduction),
  },
  supportTelephone: '0800 917 5148',
  supportExtension: '#6598',
  https: production,
  googleTagManager: {
    key: get('TAG_MANAGER_KEY', null),
    environment: get('TAG_MANAGER_ENVIRONMENT', ''), // The additional GTM snippet string that configures a non-prod environment
  },
}
