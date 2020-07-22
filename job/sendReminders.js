/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../server/utils/azure-appinsights'
import StatementsClient from '../server/data/statementsClient'
import IncidentClient from '../server/data/incidentClient'

initialiseAppInsights()

const logger = require('../log')
const { notificationServiceFactory } = require('../server/services/notificationService')
const EmailResolver = require('./reminders/emailResolver')

const db = require('../server/data/dataAccess/db')

const { authClientBuilder, systemToken } = require('../server/data/authClientBuilder')
const reminderPoller = require('./reminders/reminderPoller')
const reminderSenderFactory = require('./reminders/reminderSender')
const eventPublisher = require('../server/services/eventPublisher')(buildAppInsightsClient('use-of-force-reminder-job'))

const emailResolver = new EmailResolver(authClientBuilder, systemToken, new StatementsClient(db.query))
const notificationService = notificationServiceFactory(eventPublisher)

const reminderSender = reminderSenderFactory(notificationService)

const poll = reminderPoller(db, new IncidentClient(db.query, db.inTransaction), reminderSender, emailResolver)

async function runJob() {
  eventPublisher.publish({ name: 'StartingToSendReminders', properties: {}, detail: null })
  const totalSent = await poll()
  eventPublisher.publish({ name: 'FinishedSendingReminders', properties: { totalSent }, detail: null })
}

runJob().catch(error => logger.error(error, 'Problem polling for reminders'))
