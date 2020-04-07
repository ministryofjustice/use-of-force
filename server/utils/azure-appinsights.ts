import appInsights from 'applicationinsights'
import applicationVersion from '../application-version'

export const initialiseAppInsights = (): void => {
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')
    appInsights
      .setup()
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start()
  }
}

const defaultName = () => {
  const {
    packageData: { name },
  } = applicationVersion
  return name
}

export const buildAppInsightsClient = (name = defaultName()) => {
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    const client = appInsights.defaultClient
    client.context.tags['ai.cloud.role'] = `${name}`
    return client
  }
  return null
}
