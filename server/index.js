// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
const appInsightsClient = require('./utils/azure-appinsights')()

const createApp = require('./app')

const db = require('./data/dataAccess/db')
const incidentClient = require('./data/incidentClient')
const statementsClient = require('./data/statementsClient')
const reportingClient = require('./data/reportingClient')

const elite2ClientBuilder = require('./data/elite2ClientBuilder')
const authClientBuilder = require('./data/authClientBuilder')

const createSignInService = require('./authentication/signInService')

const createInvolvedStaffService = require('./services/involvedStaffService')
const createOffenderService = require('./services/offenderService')
const createReportService = require('./services/reportService')
const createStatementService = require('./services/statementService')
const createUserService = require('./services/userService')
const createReviewService = require('./services/reviewService')
const createReportingService = require('./services/reportingService')

const { notificationServiceFactory } = require('./services/notificationService')
const eventPublisher = require('./services/eventPublisher')(appInsightsClient)

// pass in dependencies of service

const userService = createUserService(elite2ClientBuilder, authClientBuilder)
const involvedStaffService = createInvolvedStaffService({ incidentClient, statementsClient, userService })
const notificationService = notificationServiceFactory(eventPublisher)
const offenderService = createOffenderService(elite2ClientBuilder)
const reportService = createReportService({
  elite2ClientBuilder,
  incidentClient,
  involvedStaffService,
  notificationService,
  db,
})
const statementService = createStatementService({ statementsClient, incidentClient, db })
const reviewService = createReviewService({ statementsClient, incidentClient })
const reportingService = createReportingService({ reportingClient })

const app = createApp({
  involvedStaffService,
  offenderService,
  notificationService,
  reportService,
  signInService: createSignInService(),
  statementService,
  userService,
  reviewService,
  reportingService,
})

module.exports = app
