import appInsights from 'applicationinsights'
import applicationVersion from '../application-version'

if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  // eslint-disable-next-line no-console
  console.log('Enabling azure application insights')
  appInsights
    .setup()
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start()
}

const defaultName = () => {
  const {
    packageData: { name },
  } = applicationVersion
  return name
}

export default function(name = defaultName()) {
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')
    appInsights
      .setup()
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start()
    const client = appInsights.defaultClient
    client.context.tags['ai.cloud.role'] = `${name}`
    return client
  }
  return null
}

/**
 * A function that does nothing.  Importing this module ensures that application insights is loaded and configured.
 * Having a call to this function is cosmetic: It stops linters, prettier etc complaining about unused imports.
 */
export const doNothing = () => undefined
