import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import EventPublisher from './eventPublisher'

jest.mock('@ministryofjustice/hmpps-azure-telemetry', () => ({
  telemetry: { trackEvent: jest.fn() },
}))
jest.mock('../../log')

let eventPublisher

beforeEach(() => {
  eventPublisher = EventPublisher()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('publish', () => {
  test('passes primitive values through unchanged', () => {
    eventPublisher.publish({
      name: 'TestEvent',
      properties: { reporterName: 'Jane Smith', reportId: 1, isOverdue: false },
    })

    expect(telemetry.trackEvent).toHaveBeenCalledWith('TestEvent', {
      reporterName: 'Jane Smith',
      reportId: 1,
      isOverdue: false,
    })
  })

  test('converts dates to ISO strings', () => {
    eventPublisher.publish({
      name: 'TestEvent',
      properties: { incidentDate: new Date('2026-10-01T09:30:00Z') },
    })

    expect(telemetry.trackEvent).toHaveBeenCalledWith('TestEvent', { incidentDate: '2026-10-01T09:30:00.000Z' })
  })

  test('converts objects and arrays to JSON', () => {
    eventPublisher.publish({
      name: 'TestEvent',
      properties: { detail: { statementId: 2 }, ids: [1, 2] },
    })

    expect(telemetry.trackEvent).toHaveBeenCalledWith('TestEvent', { detail: '{"statementId":2}', ids: '[1,2]' })
  })

  test('drops null and undefined values', () => {
    eventPublisher.publish({
      name: 'TestEvent',
      properties: { reportId: 1, submittedDate: null, statementId: undefined },
    })

    expect(telemetry.trackEvent).toHaveBeenCalledWith('TestEvent', { reportId: 1 })
  })

  test('sends no attributes when properties are not provided', () => {
    eventPublisher.publish({ name: 'TestEvent' })

    expect(telemetry.trackEvent).toHaveBeenCalledWith('TestEvent', {})
  })
})
