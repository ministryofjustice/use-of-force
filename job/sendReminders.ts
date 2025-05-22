/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../server/utils/azureAppInsights'

initialiseAppInsights()

import StatementsClient from '../server/data/statementsClient'
import IncidentClient from '../server/data/incidentClient'
import logger from '../log'
import * as db from '../server/data/dataAccess/db'

import { notificationServiceFactory } from '../server/services/notificationService'

import EmailResolver from './reminders/emailResolver'
import createReminderPoller from './reminders/reminderPoller'
import ReminderSender from './reminders/reminderSender'
import eventPublisherFactory from '../server/services/eventPublisher'
import ReportLogClient from '../server/data/reportLogClient'
import { HmppsAuthClient, ManageUsersApiClient } from '../server/data'
import applicationInfoSupplier from '../server/applicationInfo'
import config from '../server/config'
import RedisTokenStore from '../server/data/tokenStore/redisTokenStore'
import { redisClient } from '../server/data/redisClient'
import InMemoryTokenStore from '../server/data/tokenStore/inMemoryTokenStore'
import AuthService from '../server/services/authService'

const eventPublisher = eventPublisherFactory(
  buildAppInsightsClient(applicationInfoSupplier(), 'use-of-force-reminder-job')
)

const statementClient = new StatementsClient(db.query)
const reportLogClient = new ReportLogClient()
const incidentClient = new IncidentClient(db.query, db.inTransaction, reportLogClient)
const manageUsersClient = new ManageUsersApiClient()
const authClient = new HmppsAuthClient(
  config.redis.enabled ? new RedisTokenStore(redisClient) : new InMemoryTokenStore()
)
const authService = new AuthService(authClient)
const emailResolver = new EmailResolver(manageUsersClient, authService, statementClient)
const notificationService = notificationServiceFactory(eventPublisher)

const reminderSender = new ReminderSender(notificationService)

const poll = createReminderPoller(db.inTransaction, incidentClient, reminderSender, emailResolver)

async function runJob() {
  eventPublisher.publish({ name: 'StartingToSendReminders', properties: {}, detail: null })
  const totalSent = await poll()
  eventPublisher.publish({ name: 'FinishedSendingReminders', properties: { totalSent }, detail: null })
}

runJob().catch(error => logger.error(error, 'Problem polling for reminders'))
