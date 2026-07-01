import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

const config = hmppsConfig({
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs'],
  extraIgnorePaths: ['.build', 'node_modules', '**/*.js', '.allowed-scripts.mjs'],
})

export default config
