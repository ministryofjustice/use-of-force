import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // cypress is used for integration tests
    'node_modules/cypress@13.17.0': 'ALLOW',
    // Provides native integration, supporting the ability to write dtrace probes for bunyan
    'node_modules/dtrace-provider@0.8.8': 'ALLOW',
    'node_modules/@parcel/watcher@2.5.1': 'ALLOW',
    // Needed by jest for running tests in watch mode
    'node_modules/fsevents@2.3.3': 'ALLOW',
    // Native solution to quickly resolve module paths, used by jest and eslint
    'node_modules/unrs-resolver@1.11.1': 'ALLOW',
    'node_modules/applicationinsights-native-metrics@0.0.11': 'ALLOW',
  },
})
