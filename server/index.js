// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
require('./utils/azure-appinsights')

const createApp = require('./app')

const formClient = require('./data/formClient')
const elite2ClientBuilder = require('./data/elite2ClientBuilder')

const createFormService = require('./services/formService')
const createSignInService = require('./authentication/signInService')
const createOffenderService = require('./services/offenderService')
const createUserService = require('./services/userService')

// pass in dependencies of service
const formService = createFormService(formClient)
const offenderService = createOffenderService(elite2ClientBuilder)
const userService = createUserService(elite2ClientBuilder)

const app = createApp({
  formService,
  signInService: createSignInService(),
  offenderService,
  userService,
})

module.exports = app
