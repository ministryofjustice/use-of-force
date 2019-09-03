const { createNotificationService } = require('./notificationService')
const config = require('../config')

const client = {
  sendEmail: jest.fn(),
}

let service

beforeEach(() => {
  client.sendEmail.mockResolvedValue('response 1')
  service = createNotificationService(client)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('send notifications', () => {
  test('sendReminder', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    await service.sendReminder('user@email.com', { reporterName: 'Jane Smith', incidentDate })

    expect(client.sendEmail).toBeCalledWith(config.email.templates.involvedStaff.REMINDER, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Friday 15 February',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
      },
      reference: null,
    })
  })

  test('sendStatementOverdue', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    await service.sendStatementOverdue('user@email.com', { reporterName: 'Jane Smith', incidentDate })

    expect(client.sendEmail).toBeCalledWith(config.email.templates.involvedStaff.OVERDUE, 'user@email.com', {
      personalisation: {
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
      },
      reference: null,
    })
  })

  test('sendStatementRequest', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    await service.sendStatementRequest('user@email.com', {
      reporterName: 'Jane Smith',
      involvedName: 'Thelma Jones',
      incidentDate,
    })

    expect(client.sendEmail).toBeCalledWith(config.email.templates.involvedStaff.REQUEST, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Friday 15 February',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        INVOLVED_NAME: 'Thelma Jones',
      },
      reference: null,
    })
  })
})
