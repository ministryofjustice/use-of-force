const { NotifyClient } = require('notifications-node-client')
const moment = require('moment')
const config = require('../config')
const logger = require('../../log')

const createNotificationService = emailClient => {
  const asDate = date => moment(date).format('dddd D MMMM')

  const asTime = date => moment(date).format('HH:mm')

  const asDeadline = date =>
    moment(date)
      .add(3, 'days')
      .format('dddd D MMMM')

  const sendReminder = async (emailAddress, { reporterName, incidentDate }) =>
    emailClient
      .sendEmail(config.email.templates.involvedStaff.REMINDER, emailAddress, {
        personalisation: {
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          DEADLINE_DATE: asDeadline(incidentDate),
        },
        reference: null,
      })
      .then(response => logger.info(response))
      .catch(err => logger.error(err))

  const sendStatementOverdue = async (emailAddress, { reporterName, incidentDate }) =>
    emailClient
      .sendEmail(config.email.templates.involvedStaff.OVERDUE, emailAddress, {
        personalisation: {
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
        },
        reference: null,
      })
      .then(response => logger.info(response))
      .catch(err => logger.error(err))

  const sendStatementRequest = async (emailAddress, { reporterName, involvedName, incidentDate }) =>
    emailClient
      .sendEmail(config.email.templates.involvedStaff.REQUEST, emailAddress, {
        personalisation: {
          INVOLVED_NAME: involvedName,
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          DEADLINE_DATE: asDeadline(incidentDate),
        },
        reference: null,
      })
      .then(({ body }) => logger.info(`Send statement request, successful for: '${involvedName}'`, body))
      .catch(({ body }) => logger.error(`Send statement request, failed for: '${involvedName}'`, body))

  return {
    sendReminder,
    sendStatementOverdue,
    sendStatementRequest,
  }
}

module.exports = {
  createNotificationService,

  notificationServiceFactory: () => {
    const stubClient = {
      sendEmail: args => logger.info(`sendEmail: ${JSON.stringify(args)}`),
    }

    const notifyClient = config.email.enabled ? new NotifyClient(config.email.notifyKey) : stubClient
    return createNotificationService(notifyClient)
  },
}
