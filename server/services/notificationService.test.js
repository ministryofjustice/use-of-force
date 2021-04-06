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
const context = { reportId: 1, statementId: 2 }

beforeEach(() => {
  client.sendEmail.mockResolvedValue({ body: 'response 1' })
  service = createNotificationService(client, eventPublisher)
})

afterEach(() => {
  jest.resetAllMocks()
})

const incidentDate = new Date(2019, 1, 12, 14, 45)
const submittedDate = new Date(2019, 1, 14, 15, 45)
const overdueDate = new Date(2019, 1, 16, 16, 45)

describe('send reporter notifications', () => {
  test('sendReporterStatementReminder', async () => {
    await service.sendReporterStatementReminder(
      'user@email.com',
      { reporterName, incidentDate, submittedDate, overdueDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(reporter.REMINDER, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        SUBMITTED_DATE: 'Thursday 14 February',
        SUBMITTED_TIME: '15:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '14:45',
        REPORTER_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendReporterStatementReminderSuccess',
      properties: { reportId: 1, statementId: 2, incidentDate, submittedDate, reporterName },
      detail: 'response 1',
    })
  })

  test('sendReporterStatementOverdue', async () => {
    await service.sendReporterStatementOverdue('user@email.com', { reporterName, incidentDate, submittedDate }, context)

    expect(client.sendEmail).toBeCalledWith(reporter.OVERDUE, 'user@email.com', {
      personalisation: {
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '14:45',
        SUBMITTED_DATE: 'Thursday 14 February',
        SUBMITTED_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendReporterStatementOverdueSuccess',
      properties: { reportId: 1, statementId: 2, incidentDate, submittedDate, reporterName },
      detail: 'response 1',
    })
  })
})

describe('send involved staff notifications', () => {
  test('sendInvolvedStaffStatementReminder', async () => {
    await service.sendInvolvedStaffStatementReminder(
      'user@email.com',
      { involvedName, incidentDate, submittedDate, overdueDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REMINDER, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '14:45',
        SUBMITTED_DATE: 'Thursday 14 February',
        SUBMITTED_TIME: '15:45',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
        REMOVAL_REQUEST_LINK: `${emailUrl}/request-removal/2?signature=nZ+yN0VrZl1JJPoy4rs6onN6lB9Xbb8EvXzgbKiZ28A=`,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendInvolvedStaffStatementReminderSuccess',
      properties: { reportId: 1, statementId: 2, incidentDate, submittedDate, involvedName },
      detail: 'response 1',
    })
  })

  test('sendInvolvedStaffStatementOverdue', async () => {
    await service.sendInvolvedStaffStatementOverdue(
      'user@email.com',
      { involvedName, incidentDate, submittedDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(involvedStaff.OVERDUE, 'user@email.com', {
      personalisation: {
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '14:45',
        SUBMITTED_DATE: 'Thursday 14 February',
        SUBMITTED_TIME: '15:45',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
        REMOVAL_REQUEST_LINK: `${emailUrl}/request-removal/2?signature=nZ+yN0VrZl1JJPoy4rs6onN6lB9Xbb8EvXzgbKiZ28A=`,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendInvolvedStaffStatementOverdueSuccess',
      properties: { reportId: 1, statementId: 2, incidentDate, submittedDate, involvedName },
      detail: 'response 1',
    })
  })

  test('sendStatementRequest', async () => {
    await service.sendStatementRequest(
      'user@email.com',
      { reporterName, involvedName, incidentDate, submittedDate, overdueDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REQUEST, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '14:45',
        SUBMITTED_DATE: 'Thursday 14 February',
        SUBMITTED_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
        REMOVAL_REQUEST_LINK: `${emailUrl}/request-removal/2?signature=nZ+yN0VrZl1JJPoy4rs6onN6lB9Xbb8EvXzgbKiZ28A=`,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendStatementRequestSuccess',
      properties: { reportId: 1, statementId: 2, incidentDate, involvedName, submittedDate, reporterName },
      detail: 'response 1',
    })
  })

  test('sendStatementRequest Failure', async () => {
    client.sendEmail.mockRejectedValue({ message: 'message 1' })

    await service.sendStatementRequest(
      'user@email.com',
      { reporterName, involvedName, incidentDate, submittedDate, overdueDate },
      context
    )

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REQUEST, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '14:45',
        SUBMITTED_DATE: 'Thursday 14 February',
        SUBMITTED_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
        REMOVAL_REQUEST_LINK: `${emailUrl}/request-removal/2?signature=nZ+yN0VrZl1JJPoy4rs6onN6lB9Xbb8EvXzgbKiZ28A=`,
      },
      reference: null,
    })

    expect(eventPublisher.publish).toBeCalledWith({
      name: 'SendStatementRequestFailure',
      properties: { reportId: 1, statementId: 2, incidentDate, involvedName, submittedDate, reporterName },
      detail: 'message 1',
    })
  })

  describe('getRemovalRequestLink', () => {
    it('should create correctly hashed url', () => {
      const result = service.getRemovalRequestLink('123')
      expect(result).toEqual(`${emailUrl}/request-removal/123?signature=hESh8cNdn2xMrSDMWHfScbm7jgo20W94cx6+7CA31H0=`)
    })
  })
})
