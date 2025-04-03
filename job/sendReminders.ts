/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../server/utils/azure-appinsights'

initialiseAppInsights()

import StatementsClient from '../server/data/statementsClient'
import IncidentClient from '../server/data/incidentClient'
import logger from '../log'
import * as db from '../server/data/dataAccess/db'

import notificationServiceDefault from '../server/services/notificationService'
import { AuthClient, systemTokenBuilder } from '../server/data/authClient'

import EmailResolver from './reminders/emailResolver'
import createReminderPoller from './reminders/reminderPoller'
import ReminderSender from './reminders/reminderSender'
import eventPublisherFactory from '../server/services/eventPublisher'
import ReportLogClient from '../server/data/reportLogClient'
import TokenStore from '../server/data/tokenStore'
import { createRedisClient } from '../server/data/redisClient'

const eventPublisher = eventPublisherFactory(buildAppInsightsClient('use-of-force-reminder-job'))

const statementClient = new StatementsClient(db.query)
const reportLogClient = new ReportLogClient()
const incidentClient = new IncidentClient(db.query, db.inTransaction, reportLogClient)

const systemToken = systemTokenBuilder(new TokenStore(createRedisClient({ legacyMode: false })))
const emailResolver = new EmailResolver(token => new AuthClient(token), systemToken, statementClient)
const notificationService = notificationServiceDefault.notificationServiceFactory(eventPublisher)

const reminderSender = new ReminderSender(notificationService)

const poll = createReminderPoller(db.inTransaction, incidentClient, reminderSender, emailResolver)

async function runJob() {
  eventPublisher.publish({ name: 'StartingToSendReminders', properties: {}, detail: null })
  const totalSent = await poll()
  eventPublisher.publish({ name: 'FinishedSendingReminders', properties: { totalSent }, detail: null })
}

runJob().catch(error => logger.error(error, 'Problem polling for reminders'))
