const createApp = require('./app')

const formClient = require('./data/formClient')
const nomisClientBuilder = require('./data/nomisClientBuilder')

const createFormService = require('./services/formService')
const createSignInService = require('./authentication/signInService')
const createNomisService = require('./services/nomisService')

// pass in dependencies of service
const formService = createFormService(formClient)
const nomisService = createNomisService(nomisClientBuilder)

const app = createApp({
  formService,
  signInService: createSignInService(),
  nomisService,
})

module.exports = app
