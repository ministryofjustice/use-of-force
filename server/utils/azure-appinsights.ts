import { setup, defaultClient, TelemetryClient, DistributedTracingModes } from 'applicationinsights'
import applicationVersion from '../application-version'

const defaultName = (): string => {
  const {
    packageData: { name },
  } = applicationVersion
  return name
}

export const initialiseApplicationInsights = (name = defaultName()): void => {
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    const configuration = setup()
    configuration.setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C)
    defaultClient.context.tags['ai.cloud.role'] = `${name}`
    configuration.start()
  }
}

export const applicationInsightsClient = (): TelemetryClient =>
  process.env.APPINSIGHTS_INSTRUMENTATIONKEY ? defaultClient : null
