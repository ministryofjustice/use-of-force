const { createNotificationService } = require('./notificationService')
const {
  links: { emailUrl },
  email: {
    templates: { involvedStaff, reporter },
  },
} = require('../config')

const reporterName = 'Jane Smith'
const involvedName = 'Thelma Jones'

const client = {
  sendEmail: jest.fn(),
}
const eventPublisher = {
  publish: jest.fn(),
}

let service
const context = { id1: 1, id2: 'b' }

beforeEach(() => {
  client.sendEmail.mockResolvedValue({ body: 'response 1' })
  service = createNotificationService(client, eventPublisher)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('send reporter notifications', () => {
  test('sendReporterStatementReminder', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    const overdueDate = new Date(2019, 1, 16, 16, 45)

    await service.sendReporterStatementReminder('user@email.com', { reporterName, incidentDate, overdueDate }, context)

    expect(client.sendEmail).toBeCalledWith(reporter.REMINDER, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendReporterStatementReminderSuccess',
      properties: { id1: 1, id2: 'b', incidentDate, reporterName },
      detail: 'response 1',
    })
  })

  test('sendReporterStatementOverdue', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    await service.sendReporterStatementOverdue('user@email.com', { reporterName, incidentDate }, context)

    expect(client.sendEmail).toBeCalledWith(reporter.OVERDUE, 'user@email.com', {
      personalisation: {
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendReporterStatementOverdueSuccess',
      properties: { id1: 1, id2: 'b', incidentDate, reporterName },
      detail: 'response 1',
    })
  })
})

describe('send involved staff notifications', () => {
  test('sendInvolvedStaffStatementReminder', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    const overdueDate = new Date(2019, 1, 16, 16, 45)

    await service.sendInvolvedStaffStatementReminder(
      'user@email.com',
      { involvedName, incidentDate, overdueDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REMINDER, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendInvolvedStaffStatementReminderSuccess',
      properties: { id1: 1, id2: 'b', incidentDate, involvedName },
      detail: 'response 1',
    })
  })

  test('sendInvolvedStaffStatementOverdue', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    await service.sendInvolvedStaffStatementOverdue('user@email.com', { involvedName, incidentDate }, context)

    expect(client.sendEmail).toBeCalledWith(involvedStaff.OVERDUE, 'user@email.com', {
      personalisation: {
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendInvolvedStaffStatementOverdueSuccess',
      properties: { id1: 1, id2: 'b', incidentDate, involvedName },
      detail: 'response 1',
    })
  })

  test('sendStatementRequest', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    const overdueDate = new Date(2019, 1, 16, 16, 45)

    await service.sendStatementRequest(
      'user@email.com',
      { reporterName, involvedName, incidentDate, overdueDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REQUEST, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendStatementRequestSuccess',
      properties: { id1: 1, id2: 'b', incidentDate, involvedName, reporterName },
      detail: 'response 1',
    })
  })

  test('sendStatementRequest Failure', async () => {
    client.sendEmail.mockRejectedValue({ message: 'message 1' })
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    const overdueDate = new Date(2019, 1, 16, 16, 45)

    await service.sendStatementRequest(
      'user@email.com',
      { reporterName, involvedName, incidentDate, overdueDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REQUEST, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendStatementRequestFailure',
      properties: { id1: 1, id2: 'b', incidentDate, involvedName, reporterName },
      detail: 'message 1',
    })
  })
})
