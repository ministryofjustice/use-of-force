import { flushTelemetry, initialiseTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'

export function initialiseAppInsights(serviceName = 'use-of-force'): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')
  }

  initialiseTelemetry({
    serviceName,
    serviceVersion: process.env.BUILD_NUMBER || 'unknown',
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    debug: process.env.DEBUG_TELEMETRY === 'true',
  })
    .addFilter(
      telemetry.processors.filterSpanWherePath([
        '/health',
        '/health/*',
        '/info',
        '/metrics',
        '/ping',
        '/assets/*',
        '/favicon.ico',
      ]),
    )
    .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
    .startRecording()
}

export { flushTelemetry }
