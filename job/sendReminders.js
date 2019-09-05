const incidentClient = require('../server/data/incidentClient')
const db = require('../server/data/dataAccess/db')

const reminderPoller = require('./reminders/reminderPoller')
const reminderSender = require('./reminders/reminderSender')

const sendReminder = reminderSender()
const poll = reminderPoller(db, incidentClient, sendReminder)

poll()
