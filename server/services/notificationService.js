const { NotifyClient } = require('notifications-node-client')
const moment = require('moment')
const {
  links: { emailUrl },
  email: {
    enabled,
    notifyKey,
    templates: { involvedStaff, reporter },
  },
} = require('../config')
const logger = require('../../log')

const createNotificationService = (emailClient, eventPublisher) => {
  const asDate = date => moment(date).format('dddd D MMMM')

  const asTime = date => moment(date).format('HH:mm')

  const sendReporterStatementReminder = async (emailAddress, { reporterName, incidentDate, overdueDate }, context) =>
    emailClient
      .sendEmail(reporter.REMINDER, emailAddress, {
        personalisation: {
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          DEADLINE_DATE: asDate(overdueDate),
          DEADLINE_TIME: asTime(overdueDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementReminderSuccess',
          properties: { reporterName, incidentDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementReminderFailure',
          properties: { reporterName, incidentDate, ...context },
          detail: message,
        })
      )

  const sendInvolvedStaffStatementReminder = async (
    emailAddress,
    { involvedName, incidentDate, overdueDate },
    context
  ) =>
    emailClient
      .sendEmail(involvedStaff.REMINDER, emailAddress, {
        personalisation: {
          INVOLVED_NAME: involvedName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          DEADLINE_DATE: asDate(overdueDate),
          DEADLINE_TIME: asTime(overdueDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementReminderSuccess',
          properties: { involvedName, incidentDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementReminderFailure',
          properties: { involvedName, incidentDate, ...context },
          detail: message,
        })
      )

  const sendReporterStatementOverdue = async (emailAddress, { reporterName, incidentDate }, context) =>
    emailClient
      .sendEmail(reporter.OVERDUE, emailAddress, {
        personalisation: {
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementOverdueSuccess',
          properties: { reporterName, incidentDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementOverdueFailure',
          properties: { reporterName, incidentDate, ...context },
          detail: message,
        })
      )

  const sendInvolvedStaffStatementOverdue = async (emailAddress, { involvedName, incidentDate }, context) =>
    emailClient
      .sendEmail(involvedStaff.OVERDUE, emailAddress, {
        personalisation: {
          INVOLVED_NAME: involvedName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementOverdueSuccess',
          properties: { involvedName, incidentDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementOverdueFailure',
          properties: { involvedName, incidentDate, ...context },
          detail: message,
        })
      )

  const sendStatementRequest = async (
    emailAddress,
    { reporterName, involvedName, incidentDate, overdueDate },
    context
  ) =>
    emailClient
      .sendEmail(involvedStaff.REQUEST, emailAddress, {
        personalisation: {
          INVOLVED_NAME: involvedName,
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          DEADLINE_DATE: asDate(overdueDate),
          DEADLINE_TIME: asTime(overdueDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendStatementRequestSuccess',
          properties: { reporterName, involvedName, incidentDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendStatementRequestFailure',
          properties: { reporterName, involvedName, incidentDate, ...context },
          detail: message,
        })
      )

  return {
    sendStatementRequest,
    sendReporterStatementReminder,
    sendInvolvedStaffStatementReminder,
    sendReporterStatementOverdue,
    sendInvolvedStaffStatementOverdue,
  }
}

module.exports = {
  createNotificationService,

  notificationServiceFactory: eventPublisher => {
    const stubClient = {
      sendEmail: args => logger.info(`sendEmail: ${JSON.stringify(args)}`),
    }

    const notifyClient = enabled === true ? new NotifyClient(notifyKey) : stubClient
    return createNotificationService(notifyClient, eventPublisher)
  },
}
