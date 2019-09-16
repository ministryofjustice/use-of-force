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

const createNotificationService = emailClient => {
  const asDate = date => moment(date).format('dddd D MMMM')

  const asTime = date => moment(date).format('HH:mm')

  const sendReporterStatementReminder = async (emailAddress, { reporterName, incidentDate, overdueDate }) =>
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
      .then(({ body }) => logger.info(`Send statement reminder, successful for reporter: '${reporterName}'`, body))
      .catch(({ message }) => logger.error(`Send statement reminder, failed for reporter: '${reporterName}'`, message))

  const sendInvolvedStaffStatementReminder = async (emailAddress, { involvedName, incidentDate, overdueDate }) =>
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
        logger.info(`Send statement reminder, successful for involved staff: '${involvedName}'`, body)
      )
      .catch(({ message }) =>
        logger.error(`Send statement reminder, failed for involved staff: '${involvedName}'`, message)
      )

  const sendReporterStatementOverdue = async (emailAddress, { reporterName, incidentDate }) =>
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
      .then(({ body }) => logger.info(`Send statement overdue, successful for reporter: '${reporterName}'`, body))
      .catch(({ message }) => logger.error(`Send statement overdue, failed for reporter: '${reporterName}'`, message))

  const sendInvolvedStaffStatementOverdue = async (emailAddress, { involvedName, incidentDate }) =>
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
      .then(({ body }) => logger.info(`Send statement overdue, successful for involved staff: '${involvedName}'`, body))
      .catch(({ message }) =>
        logger.error(`Send statement overdue, failed for involved staff: '${involvedName}'`, message)
      )

  const sendStatementRequest = async (emailAddress, { reporterName, involvedName, incidentDate, overdueDate }) =>
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
      .then(({ body }) => logger.info(`Send statement request, successful for involved staff: '${involvedName}'`, body))
      .catch(({ message }) =>
        logger.error(`Send statement request, failed for involved staff: '${involvedName}'`, message)
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

  notificationServiceFactory: () => {
    const stubClient = {
      sendEmail: args => logger.info(`sendEmail: ${JSON.stringify(args)}`),
    }

    const notifyClient = enabled === true ? new NotifyClient(notifyKey) : stubClient
    return createNotificationService(notifyClient)
  },
}
