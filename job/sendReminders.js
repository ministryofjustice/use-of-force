// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
// eslint-disable-next-line import/no-unresolved
require('../server/utils/azure-appinsights')('use-of-force-reminder-job')

const { createNamespace } = require('cls-hooked')
const logger = require('../log')
const { notificationServiceFactory } = require('../server/services/notificationService')

const incidentClient = require('../server/data/incidentClient')
const db = require('../server/data/dataAccess/db')
const reminderPoller = require('./reminders/reminderPoller')
const reminderSender = require('./reminders/reminderSender')

const notificationService = notificationServiceFactory()

const sendReminder = reminderSender(notificationService, incidentClient).send
const poll = reminderPoller(db, incidentClient, sendReminder)

const session = createNamespace('request.scope')

session.run(() => {
  poll().catch(error => logger.error(error, 'Problem polling for reminders'))
})
