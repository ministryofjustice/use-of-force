// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
require('./utils/azure-appinsights')

const createApp = require('./app')

const formClient = require('./data/formClient')
const elite2ClientBuilder = require('./data/elite2ClientBuilder')

const createIncidentService = require('./services/incidentService')
const createSignInService = require('./authentication/signInService')
const createOffenderService = require('./services/offenderService')
const createUserService = require('./services/userService')

// pass in dependencies of service
const incidentService = createIncidentService({ elite2ClientBuilder, formClient })
const offenderService = createOffenderService(elite2ClientBuilder)
const userService = createUserService(elite2ClientBuilder)

const app = createApp({
  incidentService,
  signInService: createSignInService(),
  offenderService,
  userService,
})

module.exports = app
