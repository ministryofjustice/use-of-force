/*
 * Do Application Insights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, Application Insights automatically collects bunyan logs
 */
import { initialiseApplicationInsights, applicationInsightsClient } from '../server/utils/azure-appinsights'

initialiseApplicationInsights('use-of-force-reminder-job')

const logger = require('../log')
const { notificationServiceFactory } = require('../server/services/notificationService')
const EmailResolver = require('./reminders/emailResolver')

const incidentClient = require('../server/data/incidentClient')
const statementsClient = require('../server/data/statementsClient')

const { authClientBuilder, systemToken } = require('../server/data/authClientBuilder')

const db = require('../server/data/dataAccess/db')
const reminderPoller = require('./reminders/reminderPoller')
const reminderSenderFactory = require('./reminders/reminderSender')
const eventPublisher = require('../server/services/eventPublisher')(applicationInsightsClient())

const emailResolver = new EmailResolver(authClientBuilder, systemToken, statementsClient)
const notificationService = notificationServiceFactory(eventPublisher)

const reminderSender = reminderSenderFactory(notificationService)

const poll = reminderPoller(db, incidentClient, reminderSender, emailResolver)

async function runJob() {
  eventPublisher.publish({ name: 'StartingToSendReminders', properties: {}, detail: null })
  const totalSent = await poll()
  eventPublisher.publish({ name: 'FinishedSendingReminders', properties: { totalSent }, detail: null })
}

runJob().catch(error => logger.error(error, 'Problem polling for reminders'))
