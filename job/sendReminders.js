const { createNamespace } = require('cls-hooked')
const logger = require('../log')

const incidentClient = require('../server/data/incidentClient')
const db = require('../server/data/dataAccess/db')

const reminderPoller = require('./reminders/reminderPoller')
const reminderSender = require('./reminders/reminderSender')

const sendReminder = reminderSender()
const poll = reminderPoller(db, incidentClient, sendReminder)

const session = createNamespace('request.scope')

session.run(() => {
  poll().catch(error => logger.error(error, 'Problem polling for reminders'))
})
