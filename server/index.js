// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
require('./utils/azure-appinsights')

const createApp = require('./app')

const incidentClient = require('./data/incidentClient')
const elite2ClientBuilder = require('./data/elite2ClientBuilder')
const authClientBuilder = require('./data/authClientBuilder')

const createSignInService = require('./authentication/signInService')

const createIncidentService = require('./services/incidentService')
const createInvolvedStaffService = require('./services/involvedStaffService')
const createOffenderService = require('./services/offenderService')
const createStatementService = require('./services/statementService')
const createUserService = require('./services/userService')

// pass in dependencies of service
const userService = createUserService(elite2ClientBuilder, authClientBuilder)
const incidentService = createIncidentService({ elite2ClientBuilder, incidentClient })
const involvedStaffService = createInvolvedStaffService({ userService })
const offenderService = createOffenderService(elite2ClientBuilder)
const statementService = createStatementService({ incidentClient })

const app = createApp({
  incidentService,
  involvedStaffService,
  offenderService,
  userService,
  signInService: createSignInService(),
  statementService,
})

module.exports = app
