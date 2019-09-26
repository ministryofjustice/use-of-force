const { createNamespace } = require('cls-hooked')

const appInsightsclient = require('../server/utils/azure-appinsights')('use-of-force-reminder-job')
const logger = require('../log')
const { notificationServiceFactory } = require('../server/services/notificationService')

const incidentClient = require('../server/data/incidentClient')
const db = require('../server/data/dataAccess/db')
const reminderPoller = require('./reminders/reminderPoller')
const reminderSender = require('./reminders/reminderSender')
const eventPublisher = require('../server/services/eventPublisher')(appInsightsclient)

const notificationService = notificationServiceFactory(eventPublisher)

const sendReminder = reminderSender(notificationService, incidentClient).send
const poll = reminderPoller(db, incidentClient, sendReminder, eventPublisher)

const session = createNamespace('request.scope')

session.run(() => {
  poll().catch(error => logger.error(error, 'Problem polling for reminders'))
})
