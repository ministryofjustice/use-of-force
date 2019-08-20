// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
require('./utils/azure-appinsights')

const createApp = require('./app')

const incidentClient = require('./data/incidentClient')
const elite2ClientBuilder = require('./data/elite2ClientBuilder')
const authClientBuilder = require('./data/authClientBuilder')

const createIncidentService = require('./services/incidentService')
const createSignInService = require('./authentication/signInService')

const createInvolvedStaffService = require('./services/involvedStaffService')
const createOffenderService = require('./services/offenderService')
const createUserService = require('./services/userService')
const { notificationServiceFactory } = require('./services/notificationService')

// pass in dependencies of service
const incidentService = createIncidentService({ elite2ClientBuilder, incidentClient })
const offenderService = createOffenderService(elite2ClientBuilder)
const userService = createUserService(elite2ClientBuilder, authClientBuilder)
const involvedStaffService = createInvolvedStaffService({ userService })
const notificationService = notificationServiceFactory()

const app = createApp({
  incidentService,
  signInService: createSignInService(),
  offenderService,
  userService,
  involvedStaffService,
  notificationService,
})

module.exports = app
