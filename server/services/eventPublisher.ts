import logger from '../../log'

export default function ReminderRecorder(appInsightsClient) {
  const client = appInsightsClient || {
    trackEvent(_) {
      // do nothing
    },
  }

  return {
    publish: ({ name, properties = {}, detail }) => {
      logger.info(`Event raised: ${name}, payload: ${properties}, detail: ${detail}`)
      client.trackEvent({ name, properties })
    },
  }
}
