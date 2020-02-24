const appInsightsclient = require('../server/utils/azure-appinsights')('use-of-force-reminder-job')
const logger = require('../log')
const { notificationServiceFactory } = require('../server/services/notificationService')
const EmailResolver = require('./reminders/emailResolver')

const incidentClient = require('../server/data/incidentClient')
const statementsClient = require('../server/data/statementsClient')

const { authClientBuilder, systemToken } = require('../server/data/authClientBuilder')

const db = require('../server/data/dataAccess/db')
const reminderPoller = require('./reminders/reminderPoller')
const reminderSender = require('./reminders/reminderSender')
const eventPublisher = require('../server/services/eventPublisher')(appInsightsclient)

const emailResolver = new EmailResolver(authClientBuilder, systemToken, statementsClient)
const notificationService = notificationServiceFactory(eventPublisher)

const sendReminder = reminderSender(notificationService, incidentClient).send
const poll = reminderPoller(db, incidentClient, sendReminder, eventPublisher, emailResolver)

poll().catch(error => logger.error(error, 'Problem polling for reminders'))
