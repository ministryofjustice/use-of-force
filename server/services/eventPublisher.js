const { telemetry } = require('@ministryofjustice/hmpps-azure-telemetry')
const logger = require('../../log')

const toAttributeValue = value => {
  if (['string', 'number', 'boolean'].includes(typeof value)) return value
  if (value instanceof Date) return value.toISOString()
  return JSON.stringify(value)
}

const toAttributes = properties =>
  Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, toAttributeValue(value)]),
  )

module.exports = function ReminderRecorder() {
  return {
    publish: ({ name, properties = {}, detail }) => {
      logger.info(`Event raised: ${name}, payload: ${properties}, detail: ${detail}`)
      telemetry.trackEvent(name, toAttributes(properties))
    },
  }
}
