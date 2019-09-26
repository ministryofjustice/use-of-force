const logger = require('../../log')

module.exports = function ReminderRecorder(appInsightsClient) {
  const client = appInsightsClient || {
    trackEvent({ name, properties = {} }) {
      logger.info(`Event raised: ${name}, payload: ${properties}`)
    },
  }

  return {
    publish: ({ name, properties = {} }) => {
      client.trackEvent({ name, properties })
    },
  }
}
