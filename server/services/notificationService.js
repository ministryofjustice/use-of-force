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

  const sendReporterStatementReminder = async (
    emailAddress,
    { reporterName, incidentDate, overdueDate, submittedDate },
    context
  ) =>
    emailClient
      .sendEmail(reporter.REMINDER, emailAddress, {
        personalisation: {
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          SUBMITTED_DATE: asDate(submittedDate),
          SUBMITTED_TIME: asTime(submittedDate),
          DEADLINE_DATE: asDate(overdueDate),
          DEADLINE_TIME: asTime(overdueDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementReminderSuccess',
          properties: { reporterName, incidentDate, submittedDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementReminderFailure',
          properties: { reporterName, incidentDate, submittedDate, ...context },
          detail: message,
        })
      )

  const sendInvolvedStaffStatementReminder = async (
    emailAddress,
    { involvedName, incidentDate, submittedDate, overdueDate },
    context
  ) =>
    emailClient
      .sendEmail(involvedStaff.REMINDER, emailAddress, {
        personalisation: {
          INVOLVED_NAME: involvedName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          SUBMITTED_DATE: asDate(submittedDate),
          SUBMITTED_TIME: asTime(submittedDate),
          DEADLINE_DATE: asDate(overdueDate),
          DEADLINE_TIME: asTime(overdueDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementReminderSuccess',
          properties: { involvedName, incidentDate, submittedDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementReminderFailure',
          properties: { involvedName, incidentDate, submittedDate, ...context },
          detail: message,
        })
      )

  const sendReporterStatementOverdue = async (emailAddress, { reporterName, incidentDate, submittedDate }, context) =>
    emailClient
      .sendEmail(reporter.OVERDUE, emailAddress, {
        personalisation: {
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          SUBMITTED_DATE: asDate(submittedDate),
          SUBMITTED_TIME: asTime(submittedDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementOverdueSuccess',
          properties: { reporterName, incidentDate, submittedDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendReporterStatementOverdueFailure',
          properties: { reporterName, incidentDate, submittedDate, ...context },
          detail: message,
        })
      )

  const sendInvolvedStaffStatementOverdue = async (
    emailAddress,
    { involvedName, incidentDate, submittedDate },
    context
  ) =>
    emailClient
      .sendEmail(involvedStaff.OVERDUE, emailAddress, {
        personalisation: {
          INVOLVED_NAME: involvedName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          SUBMITTED_DATE: asDate(submittedDate),
          SUBMITTED_TIME: asTime(submittedDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementOverdueSuccess',
          properties: { involvedName, incidentDate, submittedDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendInvolvedStaffStatementOverdueFailure',
          properties: { involvedName, incidentDate, submittedDate, ...context },
          detail: message,
        })
      )

  const sendStatementRequest = async (
    emailAddress,
    { reporterName, involvedName, incidentDate, submittedDate, overdueDate },
    context
  ) =>
    emailClient
      .sendEmail(involvedStaff.REQUEST, emailAddress, {
        personalisation: {
          INVOLVED_NAME: involvedName,
          REPORTER_NAME: reporterName,
          INCIDENT_DATE: asDate(incidentDate),
          INCIDENT_TIME: asTime(incidentDate),
          SUBMITTED_DATE: asDate(submittedDate),
          SUBMITTED_TIME: asTime(submittedDate),
          DEADLINE_DATE: asDate(overdueDate),
          DEADLINE_TIME: asTime(overdueDate),
          LINK: emailUrl,
        },
        reference: null,
      })
      .then(({ body }) =>
        eventPublisher.publish({
          name: 'SendStatementRequestSuccess',
          properties: { reporterName, involvedName, incidentDate, submittedDate, ...context },
          detail: body,
        })
      )
      .catch(({ message }) =>
        eventPublisher.publish({
          name: 'SendStatementRequestFailure',
          properties: { reporterName, involvedName, incidentDate, submittedDate, ...context },
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
