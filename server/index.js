const createApp = require('./app')

const formClient = require('./data/formClient')
const elite2ClientBuilder = require('./data/elite2ClientBuilder')

const createFormService = require('./services/formService')
const createSignInService = require('./authentication/signInService')
const createOffenderService = require('./services/offenderService')

// pass in dependencies of service
const formService = createFormService(formClient)
const offenderService = createOffenderService(elite2ClientBuilder)

const app = createApp({
  formService,
  signInService: createSignInService(),
  offenderService,
})

module.exports = app
